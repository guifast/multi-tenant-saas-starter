"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  type ApiEnvelope,
  type AuditLog,
  type Invitation,
  type Member,
  type Project,
  type Tenant,
  type User,
} from "../lib/api";

type ConsoleState = {
  user: User | null;
  tenants: Tenant[];
  projects: Project[];
  members: Member[];
  invitations: Invitation[];
  auditLogs: AuditLog[];
};

const emptyState: ConsoleState = {
  user: null,
  tenants: [],
  projects: [],
  members: [],
  invitations: [],
  auditLogs: [],
};

function formString(formData: FormData, key: string, fallback = ""): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

export function SaasConsole({ initialSlug }: { initialSlug?: string }) {
  const router = useRouter();
  const [state, setState] = useState<ConsoleState>(emptyState);
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(initialSlug);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTenant = useMemo(
    () =>
      state.tenants.find((tenant) => tenant.slug === selectedSlug) ?? state.tenants[0],
    [selectedSlug, state.tenants],
  );

  const loadTenantDetails = useCallback(async (slug: string) => {
    const [projects, members, invitations, auditLogs] = await Promise.all([
      apiRequest<ApiEnvelope<Project[]>>(`/tenants/${slug}/projects`),
      apiRequest<ApiEnvelope<Member[]>>(`/tenants/${slug}/members`),
      apiRequest<ApiEnvelope<Invitation[]>>(`/tenants/${slug}/invitations`),
      apiRequest<ApiEnvelope<AuditLog[]>>(`/tenants/${slug}/audit-logs`),
    ]);
    setState((current) => ({
      ...current,
      projects: projects.data,
      members: members.data,
      invitations: invitations.data,
      auditLogs: auditLogs.data,
    }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await apiRequest<ApiEnvelope<{ user: User | null }>>("/auth/me");
      if (!me.data.user) {
        router.push("/login");
        return;
      }
      const tenants = await apiRequest<ApiEnvelope<Tenant[]>>("/tenants");
      const nextSlug = initialSlug ?? tenants.data[0]?.slug;
      setState((current) => ({ ...current, user: me.data.user, tenants: tenants.data }));
      setSelectedSlug(nextSlug);
      if (nextSlug) await loadTenantDetails(nextSlug);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load console.");
    } finally {
      setLoading(false);
    }
  }, [initialSlug, loadTenantDetails, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<void>, success: string) {
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      if (selectedTenant) await loadTenantDetails(selectedTenant.slug);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    }
  }

  async function createTenant(formData: FormData) {
    const name = formString(formData, "name");
    const slug = formString(formData, "slug");
    await run(async () => {
      const tenant = await apiRequest<ApiEnvelope<Tenant>>("/tenants", {
        method: "POST",
        json: { name, slug: slug || undefined },
      });
      const tenants = await apiRequest<ApiEnvelope<Tenant[]>>("/tenants");
      setState((current) => ({ ...current, tenants: tenants.data }));
      setSelectedSlug(tenant.data.slug);
      router.push(`/workspaces/${tenant.data.slug}`);
    }, "Workspace created.");
  }

  async function createProject(formData: FormData) {
    if (!selectedTenant) return;
    await run(async () => {
      await apiRequest<ApiEnvelope<Project>>(`/tenants/${selectedTenant.slug}/projects`, {
        method: "POST",
        json: {
          name: formString(formData, "name"),
          description: formString(formData, "description"),
          status: formString(formData, "status", "PLANNED"),
        },
      });
    }, "Project created.");
  }

  async function inviteMember(formData: FormData) {
    if (!selectedTenant) return;
    await run(async () => {
      await apiRequest<ApiEnvelope<Invitation>>(
        `/tenants/${selectedTenant.slug}/invitations`,
        {
          method: "POST",
          json: {
            email: formString(formData, "email"),
            role: formString(formData, "role", "VIEWER"),
          },
        },
      );
    }, "Invitation created.");
  }

  async function archiveProject(projectId: string) {
    if (!selectedTenant) return;
    await run(async () => {
      await apiRequest<ApiEnvelope<Project>>(
        `/tenants/${selectedTenant.slug}/projects/${projectId}`,
        {
          method: "DELETE",
        },
      );
    }, "Project archived.");
  }

  async function logout() {
    await apiRequest<ApiEnvelope<{ ok: true }>>("/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="console-page">
        <div className="container">
          <p className="notice">Loading console...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="console-page">
      <div className="container">
        <div className="panel-header" style={{ border: 0, padding: 0 }}>
          <div>
            <p className="eyebrow">SaaS console</p>
            <h1 className="page-title">Workspace control plane</h1>
            <p className="page-subtitle">
              Manage tenants, members, invitations and projects through the same API a
              real product would use.
            </p>
          </div>
          <button className="button" onClick={() => void logout()} type="button">
            Logout
          </button>
        </div>

        {error ? (
          <p className="notice error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="notice">{message}</p> : null}

        <div className="console-grid">
          <aside className="sidebar">
            <p className="row-title">{state.user?.name}</p>
            <p className="row-meta">{state.user?.email}</p>
            <div className="workspace-list">
              {state.tenants.map((tenant) => (
                <button
                  className={`button workspace-button ${
                    tenant.slug === selectedTenant?.slug ? "active" : ""
                  }`}
                  key={tenant.id}
                  onClick={() => {
                    setSelectedSlug(tenant.slug);
                    router.push(`/workspaces/${tenant.slug}`);
                    void loadTenantDetails(tenant.slug);
                  }}
                  type="button"
                >
                  {tenant.name}
                </button>
              ))}
            </div>
            <form action={createTenant}>
              <div className="field">
                <label htmlFor="tenant-name">New workspace</label>
                <input id="tenant-name" name="name" placeholder="Acme Inc" required />
              </div>
              <div className="field">
                <label htmlFor="tenant-slug">Slug</label>
                <input id="tenant-slug" name="slug" placeholder="acme" />
              </div>
              <div className="form-actions">
                <button className="button primary" type="submit">
                  Create
                </button>
              </div>
            </form>
          </aside>

          <section className="panel">
            {selectedTenant ? (
              <>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">/{selectedTenant.slug}</p>
                    <h2 style={{ margin: 0 }}>{selectedTenant.name}</h2>
                    <p className="row-meta">Current role: {selectedTenant.role}</p>
                  </div>
                  <span className="pill">{state.projects.length} projects</span>
                </div>
                <div className="panel-body">
                  <div className="three-col">
                    <Metric label="Members" value={state.members.length} />
                    <Metric label="Open invites" value={state.invitations.length} />
                    <Metric label="Audit events" value={state.auditLogs.length} />
                  </div>

                  <div className="two-col">
                    <form action={createProject} className="mini-card">
                      <h3 style={{ marginTop: 0 }}>Create project</h3>
                      <div className="field">
                        <label htmlFor="project-name">Name</label>
                        <input id="project-name" name="name" required />
                      </div>
                      <div className="field">
                        <label htmlFor="project-status">Status</label>
                        <select id="project-status" name="status" defaultValue="PLANNED">
                          <option value="PLANNED">Planned</option>
                          <option value="ACTIVE">Active</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="project-description">Description</label>
                        <textarea id="project-description" name="description" />
                      </div>
                      <div className="form-actions">
                        <button className="button primary" type="submit">
                          Create project
                        </button>
                      </div>
                    </form>

                    <form action={inviteMember} className="mini-card">
                      <h3 style={{ marginTop: 0 }}>Invite member</h3>
                      <div className="field">
                        <label htmlFor="invite-email">Email</label>
                        <input id="invite-email" name="email" type="email" required />
                      </div>
                      <div className="field">
                        <label htmlFor="invite-role">Role</label>
                        <select id="invite-role" name="role" defaultValue="VIEWER">
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      </div>
                      <div className="form-actions">
                        <button className="button primary" type="submit">
                          Send invite
                        </button>
                      </div>
                    </form>
                  </div>

                  <Section title="Projects">
                    {state.projects.map((project) => (
                      <div className="row" key={project.id}>
                        <div>
                          <p className="row-title">{project.name}</p>
                          <p className="row-meta">
                            {project.description || "No description"}
                          </p>
                        </div>
                        <div className="form-actions">
                          <span className="pill">{project.status}</span>
                          {project.status !== "ARCHIVED" ? (
                            <button
                              className="button danger"
                              onClick={() => void archiveProject(project.id)}
                              type="button"
                            >
                              Archive
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </Section>

                  <div className="two-col">
                    <Section title="Members">
                      {state.members.map((member) => (
                        <div className="row" key={member.id}>
                          <div>
                            <p className="row-title">{member.user.name}</p>
                            <p className="row-meta">{member.user.email}</p>
                          </div>
                          <span className="pill">{member.role}</span>
                        </div>
                      ))}
                    </Section>

                    <Section title="Invitations">
                      {state.invitations.map((invite) => (
                        <div className="row" key={invite.id}>
                          <div>
                            <p className="row-title">{invite.email}</p>
                            <p className="row-meta">
                              {invite.acceptedAt
                                ? "Accepted"
                                : invite.revokedAt
                                  ? "Revoked"
                                  : "Open"}
                            </p>
                          </div>
                          <span className="pill">{invite.role}</span>
                        </div>
                      ))}
                    </Section>
                  </div>

                  <Section title="Audit log">
                    {state.auditLogs.map((log) => (
                      <div className="row" key={log.id}>
                        <div>
                          <p className="row-title">{log.action}</p>
                          <p className="row-meta">
                            {log.entityType} {log.entityId ? `- ${log.entityId}` : ""}
                          </p>
                        </div>
                        <span className="pill">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </Section>
                </div>
              </>
            ) : (
              <div className="panel-body">
                <p className="notice">Create a workspace to start using the console.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="mini-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mini-card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div className="list">{children}</div>
    </section>
  );
}
