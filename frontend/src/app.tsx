import { Navigate, Route, Routes } from 'react-router';
import { Account } from './account';
import { AuthForm } from './auth/auth-form';
import { SessionRoute } from './auth/session-route';

export function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SessionRoute><AuthForm key="signin" mode="signin" /></SessionRoute>} />
      <Route path="/signup" element={<SessionRoute><AuthForm key="signup" mode="signup" /></SessionRoute>} />
      <Route path="/app" element={<SessionRoute protected>{(session) => <Account {...session} />}</SessionRoute>} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
