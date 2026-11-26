import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Mail, UserRound } from 'lucide-react';
import { errorDetails, logout, sessionKey, signedOutSession, type Session } from './auth/api';
import { Brand, Button } from './components/ui';

export function Account({ user }: Session) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: logout,
    async onSuccess() {
      await client.cancelQueries({ queryKey: sessionKey });
      client.setQueryData(sessionKey, signedOutSession);
    },
  });
  const names = user.name.split(/\s+/);
  const initials = [names[0], ...(names.length > 1 ? [names[names.length - 1]] : [])]
    .map((part) => [...part][0]?.toUpperCase()).join('');

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Brand />
          <Button variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            <LogOut size={17} aria-hidden="true" />
            {mutation.isPending ? 'Signing out…' : 'Log out'}
          </Button>
        </div>
      </header>
      <main className="account-main">
        <div className="welcome">
          <div className="session-label"><span aria-hidden="true" />Active session</div>
          <h1>Welcome to the application.</h1>
          <p>You’re signed in to your account.</p>
        </div>
        {mutation.isError && (
          <p className="notice notice-error" role="alert">
            {errorDetails(mutation.error, 'Couldn’t sign out. Please try again.').message}
          </p>
        )}
        <section className="account-card" aria-labelledby="account-heading">
          <div className="account-card-heading">
            <UserRound size={17} aria-hidden="true" />
            <h2 id="account-heading">Account information</h2>
          </div>
          <div className="account-card-body">
            <div className="avatar" aria-hidden="true">{initials}</div>
            <dl className="account-details">
              <div>
                <dt><UserRound size={16} aria-hidden="true" />Full name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt><Mail size={16} aria-hidden="true" />Email address</dt>
                <dd>{user.email}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    </>
  );
}
