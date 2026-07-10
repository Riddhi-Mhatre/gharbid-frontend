import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+91[0-9]{10}$/, 'Must be +91 followed by 10 digits').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['buyer', 'seller']),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().min(6, 'Code must be at least 6 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const bidSchema = z.object({
  amount: z.number({ invalid_type_error: 'Enter a valid number' }).positive('Bid must be positive').int('Bid must be a whole number'),
});

export const propertySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Describe the property in at least 50 characters'),
  type: z.enum(['apartment', 'house', 'villa', 'plot', 'commercial']),
  price: z.number().positive('Enter a valid price'),
  area: z.number().positive('Enter area in sq ft'),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  address: z.string().min(10, 'Enter full address'),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type BidFormData = z.infer<typeof bidSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const verifySchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().min(6, 'OTP must be at least 6 digits'),
});

export type VerifyFormData = z.infer<typeof verifySchema>;
