import { z } from "zod";

export interface IEmailCredentials {
  smtpHost: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
}

export const emailCredentials = z.object({
  smtpHost: z.string().min(2, "Host is required"),
  smtpUser: z.string().min(2, "User is required"),
  smtpPassword: z.string().min(2, "Password is required"),
  smtpFromEmail: z.string().min(2, "From email is required"),
});

export type EmailCredentialsConfig = z.infer<typeof emailCredentials>;
