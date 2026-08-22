import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  role: z.string().optional(), // We will ignore this and force CUSTOMER
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const otpVerifySchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6),
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const otpResendSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export type OtpResendInput = z.infer<typeof otpResendSchema>;
