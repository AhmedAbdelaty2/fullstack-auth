import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import * as api from './auth/api';
import { authSchemas } from './auth/validation';

vi.mock('./auth/api', async (importOriginal) => {
  const original = await importOriginal<typeof api>();
  return {
    ...original,
    getSession: vi.fn(),
    authenticate: vi.fn(),
    logout: vi.fn(),
    errorDetails: vi.fn(original.errorDetails),
  };
});

const exampleUser = { name: 'Jamie Rivera', email: 'jamie@example.com' };
const activeSession = { user: exampleUser, expiresAt: Date.now() + 3_600_000 };

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
    </QueryClientProvider>,
  );
  return { client, user: userEvent.setup() };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getSession).mockResolvedValue(null);
});

afterEach(cleanup);

describe('registration', () => {
  it('rejects registration password line breaks and preserves spaces', () => {
    const values = { ...exampleUser, password: ' Strong1! ' };
    expect(authSchemas.signup.parse(values).password).toBe(values.password);

    for (const lineBreak of ['\r', '\n']) {
      const result = authSchemas.signup.safeParse({ ...values, password: values.password + lineBreak });
      expect(result.success).toBe(false);
    }
  });

  it('validates all registration fields before sending a request', async () => {
    const { user } = renderAt('/signup');
    await screen.findByRole('heading', { name: 'Create your account' });
    await user.type(screen.getByLabelText('Full name'), ' Jo ');
    await user.type(screen.getByLabelText('Email'), 'invalid@email');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'weak');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Enter a name between 3 and 100 characters.')).toBeVisible();
    expect(screen.getByText('Enter a valid email address.')).toBeVisible();
    expect(screen.getByLabelText('Password', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Full name')).toHaveFocus();
    expect(api.authenticate).not.toHaveBeenCalled();
  });

  it('updates the live password checklist and toggles visibility', async () => {
    const { user } = renderAt('/signup');
    const password = await screen.findByLabelText('Password', { exact: true });
    const checklist = within(screen.getByRole('list'));
    expect(checklist.getAllByText('(not met)')).toHaveLength(4);
    await user.type(password, 'a1!');
    expect(checklist.getAllByText('(met)')).toHaveLength(3);
    await user.type(password, 'bcdef');
    expect(checklist.getAllByText('(met)')).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});

describe('authentication routes', () => {
  it('displays a login error and keeps the form available', async () => {
    vi.mocked(api.authenticate).mockRejectedValue(new Error('test credentials'));
    vi.mocked(api.errorDetails).mockReturnValue({ message: 'Invalid email or password.' });
    const { user } = renderAt('/signin');
    await user.type(await screen.findByLabelText('Email'), 'jamie@example.com');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('redirects unauthenticated visitors from the account', async () => {
    renderAt('/app');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Welcome to the application.' })).toBeNull();
  });

  it('redirects signed-in visitors from signup and shows their actual account', async () => {
    vi.mocked(api.getSession).mockResolvedValue(activeSession);
    renderAt('/signup');
    expect(await screen.findByRole('heading', { name: 'Welcome to the application.' })).toBeVisible();
    expect(screen.getByText(exampleUser.name)).toBeVisible();
    expect(screen.getByText(exampleUser.email)).toBeVisible();
  });

  it('clears cached account data on logout and returns to sign-in', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce(activeSession);
    vi.mocked(api.logout).mockResolvedValue(undefined);
    const { client, user } = renderAt('/app');
    await user.click(await screen.findByRole('button', { name: 'Log out' }));
    expect(await screen.findByText('You signed out.')).toBeVisible();
    expect(api.logout).toHaveBeenCalledOnce();
    expect([null, api.signedOutSession]).toContain(client.getQueryData(api.sessionKey));
    expect(screen.queryByText(exampleUser.email)).toBeNull();
  });

  it('redirects back to sign-in when the cached session expires', async () => {
    vi.mocked(api.getSession).mockResolvedValueOnce(activeSession);
    const { client } = renderAt('/app');
    await screen.findByRole('heading', { name: 'Welcome to the application.' });
    act(() => {
      client.setQueryData(api.sessionKey, { ...activeSession, expiresAt: Date.now() - 1 });
    });
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeVisible();
    expect(client.getQueryData(api.sessionKey)).toBeNull();
  });
});
