import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    username: z.string()
      .min(3, 'Username must be at least 3 characters.')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric and can contain underscores.'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address.').optional(),
    username: z.string().optional(),
    password: z.string().min(1, 'Password is required.'),
  }).refine((data) => data.email || data.username, {
    message: 'Either email or username is required.',
    path: ['email'],
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address.'),
    otp: z.string().length(6, 'OTP must be 6 characters long.'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address.'),
  }),
});
