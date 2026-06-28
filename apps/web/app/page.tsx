import Link from "next/link";
import {
  Activity,
  Building2,
  ClipboardCheck,
  KeyRound,
  ShieldCheck,
  Users,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Tenant isolation",
    body: "Every workspace read and write is scoped through membership context and tenant-aware queries.",
  },
  {
    icon: KeyRound,
    title: "Session auth",
    body: "HttpOnly session cookies, CSRF token checks on mutations and generic credential errors.",
  },
  {
    icon: Users,
    title: "RBAC and invites",
    body: "Owner, admin, member and viewer roles with hashed invitation tokens and audit trails.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="container hero">
        <div>
          <p className="eyebrow">Open-source SaaS foundation</p>
          <h1>Build the product, not the tenant layer.</h1>
          <p>
            A production-oriented TypeScript starter for multi-tenant SaaS products with
            NestJS, Next.js, PostgreSQL, Prisma, RBAC, invitations and audit logs wired
            together.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/register">
              Start locally
            </Link>
            <Link className="button" href="/dashboard">
              Open console
            </Link>
          </div>
        </div>
        <div className="preview" aria-label="Product preview">
          <div className="preview-header">
            <span className="brand">
              <span className="mark">AC</span>
              Acme Workspace
            </span>
            <span className="pill">OWNER</span>
          </div>
          <div className="preview-grid">
            <div className="metric-row">
              <div>
                <p className="metric-label">Active projects</p>
                <p className="metric-value">12</p>
              </div>
              <Activity size={26} aria-hidden="true" />
            </div>
            <div className="project-row">
              <div>
                <p className="row-title">Billing workspace rollout</p>
                <p className="row-meta">Scoped to acme, assigned to platform team</p>
              </div>
              <span className="pill">ACTIVE</span>
            </div>
            <div className="project-row">
              <div>
                <p className="row-title">Invite admin workflow</p>
                <p className="row-meta">Audited member lifecycle</p>
              </div>
              <span className="pill">PLANNED</span>
            </div>
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature" key={feature.title}>
                <Icon size={24} aria-hidden="true" />
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="container section">
        <div className="two-col">
          <div className="feature">
            <Building2 size={24} aria-hidden="true" />
            <h3>API-first workspace model</h3>
            <p>
              Tenants, members, projects and audit logs are exposed through documented
              REST endpoints ready for a real product surface.
            </p>
          </div>
          <div className="feature">
            <ClipboardCheck size={24} aria-hidden="true" />
            <h3>Quality gates included</h3>
            <p>
              The monorepo ships with lint, typecheck, tests, Docker Compose, CI and seed
              data for fast local validation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
