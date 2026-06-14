// Shared types + the inbound form contract. Zod validates every lead payload (F1).
import { z } from "zod";

export const LeadFormSchema = z.object({
  full_name: z.string().min(1).max(200),
  email_address: z.string().email(),
  phone_number: z.string().max(50).optional(),
  fitness_goal: z.string().max(200).optional(),
  preferred_gym_location: z.string().max(200).optional(),
  membership_type: z.string().max(100).optional(),
  // UTM stored in dedicated columns, not in form_data
  utm_source: z.string().max(255).optional(),
  utm_medium: z.string().max(255).optional(),
  utm_campaign: z.string().max(255).optional(),
});

export type LeadForm = z.infer<typeof LeadFormSchema>;

export type LeadStatus =
  | "received" | "processing" | "email_sent" | "email_failed" | "completed";
