import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Circle } from 'lucide-react';
import { useRef, type FormEventHandler } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation } from 'react-router';
import { AuthLayout, Button, Field } from '../components/ui';
import { authenticate, errorDetails, sessionKey } from './api';
import { authSchemas, type FormValues, passwordRules } from './validation';

const details = {
  signin: {
    title: 'Welcome back',
    intro: 'Enter your email and password to sign in.',
    action: 'Sign in',
    pending: 'Signing in…',
    prompt: 'Don’t have an account?',
    link: 'Sign up',
    href: '/signup',
  },
  signup: {
    title: 'Create your account',
    intro: 'Enter your details to create your account.',
    action: 'Create account',
    pending: 'Creating account…',
    prompt: 'Already have an account?',
    link: 'Sign in',
    href: '/signin',
  },
};

export function AuthForm({ mode }: { mode: keyof typeof details }) {
  const signup = mode === 'signup';
  const copy = details[mode];
  const queryClient = useQueryClient();
  const location = useLocation();
  const submitting = useRef(false);
  const { register, handleSubmit, control, setError, clearErrors, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(authSchemas[mode]),
      defaultValues: signup ? { name: '', email: '', password: '' } : { email: '', password: '' },
    });

  const password = useWatch({ control, name: 'password' });
  const submit: FormEventHandler<HTMLFormElement> = (event) => {
    if (submitting.current) {
      event.preventDefault();
      return;
    }
    submitting.current = true;
    void handleSubmit(async (values) => {
      clearErrors('root');
      try {
        const session = await authenticate(values);
        await queryClient.cancelQueries({ queryKey: sessionKey });
        queryClient.setQueryData(sessionKey, session);
      } catch (error) {
        const result = errorDetails(error, 'Unable to connect. Please try again.');
        if (result.fields) {
          const names = ['name', 'email', 'password'] as const;
          const invalidFields = names.filter((name) => result.fields?.[name] && (signup || name !== 'name'));
          invalidFields.forEach((name, index) => {
            setError(name, { type: 'server', message: result.fields?.[name] }, { shouldFocus: index === 0 });
          });
          if (invalidFields.length) return;
        }
        setError('root', { message: result.message });
      }
    })(event).finally(() => {
      submitting.current = false;
    });
  };

  return (
    <AuthLayout>
      <div className={signup ? 'auth-intro' : 'auth-intro signin-intro'}>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </div>
      {mode === 'signin' && location.state?.signedOut === true && (
        <output className="notice notice-success">You signed out.</output>
      )}
      <form className="auth-form" noValidate onSubmit={submit} aria-busy={isSubmitting}>
        {signup && (
          <Field id="name" label="Full name" autoComplete="name" placeholder="Alex Morgan"
            error={errors.name?.message} {...register('name')} />
        )}
        <Field id="email" label="Email" type="email" autoComplete="username" placeholder="alex@example.com"
          error={errors.email?.message} {...register('email')} />
        <Field id="password" label="Password" password autoComplete={signup ? 'new-password' : 'current-password'}
          placeholder={signup ? 'Choose a password' : 'Enter your password'}
          hintId={signup ? 'password-requirements' : undefined}
          error={errors.password?.message} {...register('password')} />
        {signup && <PasswordChecklist password={password} />}
        {errors.root?.message && <p className="notice notice-error" role="alert">{errors.root.message}</p>}
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? copy.pending : copy.action}
        </Button>
      </form>
      <p className="auth-switch">{copy.prompt} <Link to={copy.href}>{copy.link}</Link></p>
    </AuthLayout>
  );
}

function PasswordChecklist({ password }: { password: string }) {
  return (
    <div id="password-requirements" className="password-checklist">
      <p>Password requirements</p>
      <ul aria-live="polite">
        {passwordRules.map((rule) => {
          const met = rule.meets(password);
          return (
            <li key={rule.label} className={met ? 'criterion-met' : undefined}>
              {met ? <Check size={15} strokeWidth={2.4} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}
              <span>{rule.label}<span className="sr-only"> ({met ? 'met' : 'not met'})</span></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
