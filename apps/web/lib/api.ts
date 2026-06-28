export type ApiEnvelope<T> = {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  assignedToId: string | null;
  createdAt: string;
};

export type Member = {
  id: string;
  role: Tenant["role"];
  user: User;
};

export type Invitation = {
  id: string;
  email: string;
  role: Exclude<Tenant["role"], "OWNER">;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : undefined;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, body, ...requestInit } = init;
  const headers = new Headers(init.headers);
  if (json !== undefined) headers.set("content-type", "application/json");
  if (!["GET", "HEAD"].includes((init.method ?? "GET").toUpperCase())) {
    const csrf = readCookie("csrf");
    if (csrf) headers.set("x-csrf-token", csrf);
  }

  const requestBody = json !== undefined ? JSON.stringify(json) : body;
  const fetchInit: RequestInit = {
    ...requestInit,
    headers,
    credentials: "include",
  };
  if (requestBody !== undefined) fetchInit.body = requestBody;

  const response = await fetch(`${apiUrl}${path}`, {
    ...fetchInit,
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Request failed. Check the form and try again.";
    throw new Error(message);
  }
  return payload as T;
}
