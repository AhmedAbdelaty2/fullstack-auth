import { z } from 'zod';

// Matches the backend dot-atom email, name length, and Unicode password rules.
const emailPattern = /^(?=.{1,254}$)(?=[^@]{1,64}@)[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,58}[a-z0-9])$/;

export const passwordRules = [
  { label: 'At least 8 characters', meets: (value: string) => [...value].length >= 8 },
  { label: 'At least one letter', meets: (value: string) => /\p{L}/u.test(value) },
  { label: 'At least one number', meets: (value: string) => /\p{N}/u.test(value) },
  { label: 'At least one special character', meets: (value: string) => /[\p{P}\p{S}]/u.test(value) },
];

const email = z.string().trim().toLowerCase().regex(emailPattern, 'Enter a valid email address.');
const password = z.string().regex(/^[\s\S]{1,128}$/u, 'Enter a password between 1 and 128 characters.');

const signIn = z.object({ email, password });
const signUp = z.object({
  name: z.string().trim().regex(/^.{3,100}$/u, 'Enter a name between 3 and 100 characters.'),
  email,
  password: z.string().refine(
    (value) => !/[\r\n]/.test(value) && [...value].length <= 128 && passwordRules.every((rule) => rule.meets(value)),
    'Use 8 to 128 characters on one line with a letter, a number, and a special character.',
  ),
});

export const authSchemas = { signin: signIn, signup: signUp };
export type FormValues = z.infer<typeof signIn> & { name?: string };
