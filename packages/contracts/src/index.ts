import { z } from "zod";

export const roleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);
export type Role = z.infer<typeof roleSchema>;

export const projectStatusSchema = z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const emailSchema = z
  .string()
  .email()
  .transform((value) => value.trim().toLowerCase());
export const slugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: z.string().min(10).max(128),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const createTenantSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: slugSchema.optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: roleSchema.exclude(["OWNER"]),
});

export const updateMembershipSchema = z.object({
  role: roleSchema,
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).optional(),
  status: projectStatusSchema.default("PLANNED"),
  assignedToId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  tenantId: z.string().uuid().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 64);
}
