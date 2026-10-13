import { z } from "zod";

/**
 * Form validation schemas — single source of truth for auth forms.
 * Pages use these with react-hook-form's zodResolver so rules live
 * in one place instead of inside each component.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tell us your name (2+ characters).")
    .max(60, "Keep your name under 60 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password needs 6+ characters.")
    .max(128, "Keep your password under 128 characters."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
