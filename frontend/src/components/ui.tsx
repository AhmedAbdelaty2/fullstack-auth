import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps, type ReactNode } from 'react';

export function Brand() {
  return (
    <div className="brand">
      <img src="/apex.svg" alt="" width="40" height="40" />
      <span>Apex</span>
    </div>
  );
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }:
  ComponentProps<'button'> & { variant?: 'primary' | 'secondary' }) {
  return <button type={type} className={`button button-${variant} ${className}`} {...props} />;
}

interface FieldProps extends ComponentProps<'input'> {
  id: string;
  label: string;
  error?: string;
  hintId?: string;
  password?: boolean;
}

export function Field({ id, label, error, hintId, password, type, ...input }: FieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const description = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          {...input}
          id={id}
          type={password ? (visible ? 'text' : 'password') : type}
          className={password ? 'input input-with-toggle' : 'input'}
          aria-invalid={error ? true : undefined}
          aria-describedby={description}
          required
        />
        {password && (
          <button
            className="password-toggle"
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-controls={id}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <p className="field-error" id={errorId} role="alert">{error}</p>}
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <div className="auth-stack">
        <Brand />
        <div className="auth-card">{children}</div>
      </div>
    </main>
  );
}
