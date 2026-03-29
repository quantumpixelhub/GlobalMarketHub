import { z } from 'zod';

// Password validation: min 12 chars, uppercase, lowercase, number, special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

// Bangladesh phone number regex
const PHONE_REGEX = /^\+?880\d{9,10}$/;

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  phone: z.string()
    .regex(PHONE_REGEX, 'Invalid Bangladesh phone number (e.g., +8801712345678)'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[@$!%*?&]/, 'Must contain special character (@, $, !, %, *, ?, &)'),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[@$!%*?&]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const createProductSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  price: z.number()
    .positive('Price must be positive'),
  categoryId: z.string()
    .min(1, 'Category is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  phone: z.string()
    .regex(PHONE_REGEX, 'Invalid phone number'),
});

// Type exports for use in API routes
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
