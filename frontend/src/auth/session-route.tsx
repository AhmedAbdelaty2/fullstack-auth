import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { AuthLayout, Button } from '../components/ui';
import { getSession, sessionKey, signedOutSession, type Session, type SessionState } from './api';

type SessionRouteProps =
  | { protected: true; children: (session: Session) => ReactNode }
  | { protected?: false; children: ReactNode };

export function SessionRoute(props: SessionRouteProps) {
  const client = useQueryClient();
  const query = useQuery<SessionState>({
    queryKey: sessionKey,
    queryFn: ({ signal }) => getSession(signal),
    retry: false,
  });
  const data = query.data;
  const signedOut = data === signedOutSession;
  const session = signedOut ? null : data;
  const expiresAt = session?.expiresAt;

  useEffect(() => {
    if (!expiresAt) return;
    const expire = () => {
      client.setQueryData<SessionState>(sessionKey, (current) =>
        current && current !== signedOutSession && current.expiresAt === expiresAt ? null : current);
      void client.invalidateQueries({ queryKey: sessionKey });
    };
    const timer = window.setTimeout(expire, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [client, expiresAt]);

  if (query.isPending) return <AuthLayout><output>Checking your session…</output></AuthLayout>;

  if (query.isError) {
    return (
      <AuthLayout>
        <div className="session-retry">
          <h1>Couldn’t check your session</h1>
          <p className="notice notice-error" role="alert">Check your connection and try again.</p>
          <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
            {query.isFetching ? 'Checking…' : 'Try again'}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (props.protected) {
    return session ? props.children(session) : <Navigate to="/signin" replace state={{ signedOut }} />;
  }
  return session ? <Navigate to="/app" replace /> : props.children;
}
