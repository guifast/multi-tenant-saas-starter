import type { Role } from "@saas/database";

export type RequestUser = {
  id: string;
  email: string;
  name: string;
};

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  membershipId: string;
  role: Role;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      user?: RequestUser;
      tenant?: TenantContext;
    }
  }
}

export {};
