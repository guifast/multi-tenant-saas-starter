/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import "reflect-metadata";
import cookieParser from "cookie-parser";
import request from "supertest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { describe, expect, it, beforeAll, beforeEach, afterAll } from "vitest";
import { AppModule } from "./app.module";
import { CSRF_COOKIE, createOpaqueToken, hashToken } from "./common/auth/session";
import { HttpExceptionFilter } from "./common/errors/http-exception.filter";
import { RequestIdMiddleware } from "./common/logging/request-id.middleware";
import { PrismaService } from "./common/prisma/prisma.service";

type Agent = ReturnType<typeof request.agent>;

const password = "Integration123!";

function csrfFrom(response: request.Response) {
  const cookies = response.headers["set-cookie"];
  const cookieList = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
  const csrf = cookieList.find((cookie) => cookie.startsWith(`${CSRF_COOKIE}=`));
  if (!csrf) throw new Error("Missing CSRF cookie.");
  return csrf.split(";")[0]?.split("=")[1] ?? "";
}

async function register(agent: Agent, email: string, name = "Test User") {
  const response = await agent
    .post("/auth/register")
    .send({ name, email, password })
    .expect(201);
  return { csrf: csrfFrom(response), user: response.body.data.user as { id: string } };
}

async function createTenant(agent: Agent, csrf: string, name: string, slug: string) {
  const response = await agent
    .post("/tenants")
    .set("x-csrf-token", csrf)
    .send({ name, slug })
    .expect(201);
  return response.body.data as { id: string; slug: string };
}

async function createProject(agent: Agent, csrf: string, slug: string, name: string) {
  const response = await agent
    .post(`/tenants/${slug}/projects`)
    .set("x-csrf-token", csrf)
    .send({ name, status: "ACTIVE" })
    .expect(201);
  return response.body.data as { id: string; tenantId: string };
}

describe("API integration", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
    process.env.SESSION_SECRET = "test-session-secret-with-more-than-32-characters";

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.use(new RequestIdMiddleware().use);
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.project.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.session.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("registers, normalizes unique emails, hashes passwords and protects sessions", async () => {
    const agent = request.agent(app.getHttpServer());
    const { csrf, user } = await register(agent, "ALICE@Example.COM", "Alice");

    await agent
      .post("/auth/register")
      .send({ name: "Alice Copy", email: "alice@example.com", password })
      .expect(409);

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(stored.email).toBe("alice@example.com");
    expect(stored.passwordHash).not.toBe(password);

    await request(app.getHttpServer()).get("/auth/me").expect(401);
    await agent.get("/auth/me").expect(200);
    await agent.post("/auth/logout").set("x-csrf-token", csrf).expect(201);
    await agent.get("/auth/me").expect(401);

    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "alice@example.com", password: "wrong-password" })
      .expect(401)
      .expect((response) => {
        expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
      });
  });

  it("creates tenants, keeps memberships unique and prevents non-member discovery", async () => {
    const ownerAgent = request.agent(app.getHttpServer());
    const strangerAgent = request.agent(app.getHttpServer());
    const { csrf, user } = await register(ownerAgent, "owner@example.com", "Owner");
    await register(strangerAgent, "stranger@example.com", "Stranger");

    const acme = await createTenant(ownerAgent, csrf, "Acme Workspace", "acme");
    await createTenant(ownerAgent, csrf, "Beta Workspace", "beta");

    const memberships = await prisma.membership.findMany({ where: { userId: user.id } });
    expect(memberships).toHaveLength(2);
    expect(memberships.every((membership) => membership.role === "OWNER")).toBe(true);

    await prisma.membership
      .create({ data: { userId: user.id, tenantId: acme.id, role: "OWNER" } })
      .catch((error: unknown) => {
        expect(String(error)).toContain("Unique constraint");
      });

    await strangerAgent.get("/tenants/acme").expect(404);
  });

  it("enforces tenant isolation for projects, audit logs and assignees", async () => {
    const aliceAgent = request.agent(app.getHttpServer());
    const bobAgent = request.agent(app.getHttpServer());
    const { csrf: aliceCsrf } = await register(aliceAgent, "alice@example.com", "Alice");
    const { csrf: bobCsrf, user: bob } = await register(
      bobAgent,
      "bob@example.com",
      "Bob",
    );

    const acme = await createTenant(aliceAgent, aliceCsrf, "Acme", "acme");
    const beta = await createTenant(bobAgent, bobCsrf, "Beta", "beta");
    const betaProject = await createProject(bobAgent, bobCsrf, beta.slug, "Beta Plan");

    await aliceAgent.get(`/tenants/acme/projects/${betaProject.id}`).expect(404);
    await aliceAgent
      .patch(`/tenants/acme/projects/${betaProject.id}`)
      .set("x-csrf-token", aliceCsrf)
      .send({ name: "Cross tenant update" })
      .expect(404);
    await aliceAgent
      .delete(`/tenants/acme/projects/${betaProject.id}`)
      .set("x-csrf-token", aliceCsrf)
      .expect(404);
    await aliceAgent.get("/tenants/beta/audit-logs").expect(404);

    await aliceAgent
      .post("/tenants/acme/projects")
      .set("x-csrf-token", aliceCsrf)
      .send({ name: "Wrong assignee", assignedToId: bob.id })
      .expect(400);

    const response = await aliceAgent
      .post("/tenants/acme/projects")
      .set("x-csrf-token", aliceCsrf)
      .send({ name: "Scoped create", tenantId: beta.id })
      .expect(201);
    expect(response.body.data.tenantId).toBe(acme.id);
  });

  it("enforces backend role permissions and final owner protection", async () => {
    const ownerAgent = request.agent(app.getHttpServer());
    const viewerAgent = request.agent(app.getHttpServer());
    const memberAgent = request.agent(app.getHttpServer());
    const { csrf: ownerCsrf, user: owner } = await register(
      ownerAgent,
      "owner@example.com",
      "Owner",
    );
    const { csrf: viewerCsrf, user: viewer } = await register(
      viewerAgent,
      "viewer@example.com",
      "Viewer",
    );
    const { csrf: memberCsrf, user: member } = await register(
      memberAgent,
      "member@example.com",
      "Member",
    );
    const tenant = await createTenant(ownerAgent, ownerCsrf, "Acme", "acme");
    const ownerMembership = await prisma.membership.findUniqueOrThrow({
      where: { userId_tenantId: { userId: owner.id, tenantId: tenant.id } },
    });
    await prisma.membership.createMany({
      data: [
        { userId: viewer.id, tenantId: tenant.id, role: "VIEWER" },
        { userId: member.id, tenantId: tenant.id, role: "MEMBER" },
      ],
    });

    await viewerAgent
      .post("/tenants/acme/projects")
      .set("x-csrf-token", viewerCsrf)
      .send({ name: "Viewer mutation" })
      .expect(403);
    await memberAgent
      .post("/tenants/acme/invitations")
      .set("x-csrf-token", memberCsrf)
      .send({ email: "new@example.com", role: "VIEWER" })
      .expect(403);
    await ownerAgent
      .patch(`/tenants/acme/members/${ownerMembership.id}`)
      .set("x-csrf-token", ownerCsrf)
      .send({ role: "ADMIN" })
      .expect(409);
    await ownerAgent
      .delete(`/tenants/acme/members/${ownerMembership.id}`)
      .set("x-csrf-token", ownerCsrf)
      .expect(409);
  });

  it("keeps invitation tokens hashed, single-account and idempotent", async () => {
    const ownerAgent = request.agent(app.getHttpServer());
    const invitedAgent = request.agent(app.getHttpServer());
    const attackerAgent = request.agent(app.getHttpServer());
    const { csrf: ownerCsrf } = await register(ownerAgent, "owner@example.com", "Owner");
    await createTenant(ownerAgent, ownerCsrf, "Acme", "acme");

    const inviteResponse = await ownerAgent
      .post("/tenants/acme/invitations")
      .set("x-csrf-token", ownerCsrf)
      .send({ email: "invited@example.com", role: "MEMBER" })
      .expect(201);
    expect(inviteResponse.body.data.invitation).not.toHaveProperty("tokenHash");
    const token = String(inviteResponse.body.data.developmentUrl).split("/").at(-1);
    expect(token).toBeTruthy();

    const storedInvite = await prisma.invitation.findFirstOrThrow({
      where: { email: "invited@example.com" },
    });
    expect(storedInvite.tokenHash).toBe(hashToken(token!));
    expect(storedInvite.tokenHash).not.toBe(token);

    const { csrf: attackerCsrf } = await register(
      attackerAgent,
      "attacker@example.com",
      "Attacker",
    );
    await attackerAgent
      .post(`/invitations/${token}/accept`)
      .set("x-csrf-token", attackerCsrf)
      .expect(403);

    const { csrf: invitedCsrf, user: invited } = await register(
      invitedAgent,
      "invited@example.com",
      "Invited",
    );
    await Promise.all([
      invitedAgent.post(`/invitations/${token}/accept`).set("x-csrf-token", invitedCsrf),
      invitedAgent.post(`/invitations/${token}/accept`).set("x-csrf-token", invitedCsrf),
    ]);

    const memberships = await prisma.membership.findMany({
      where: { userId: invited.id },
    });
    const acceptedAudits = await prisma.auditLog.findMany({
      where: { action: "invitation.accepted", entityId: storedInvite.id },
    });
    expect(memberships).toHaveLength(1);
    expect(acceptedAudits).toHaveLength(1);
  });

  it("rejects expired and revoked invitations", async () => {
    const ownerAgent = request.agent(app.getHttpServer());
    const expiredAgent = request.agent(app.getHttpServer());
    const revokedAgent = request.agent(app.getHttpServer());
    const { csrf: ownerCsrf, user: owner } = await register(
      ownerAgent,
      "owner@example.com",
      "Owner",
    );
    const tenant = await createTenant(ownerAgent, ownerCsrf, "Acme", "acme");
    const { csrf: expiredCsrf } = await register(
      expiredAgent,
      "expired@example.com",
      "Expired",
    );
    const expiredToken = createOpaqueToken();
    await prisma.invitation.create({
      data: {
        tenantId: tenant.id,
        email: "expired@example.com",
        role: "VIEWER",
        tokenHash: hashToken(expiredToken),
        invitedById: owner.id,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    await expiredAgent
      .post(`/invitations/${expiredToken}/accept`)
      .set("x-csrf-token", expiredCsrf)
      .expect(410);

    const { csrf: revokedCsrf } = await register(
      revokedAgent,
      "revoked@example.com",
      "Revoked",
    );
    const inviteResponse = await ownerAgent
      .post("/tenants/acme/invitations")
      .set("x-csrf-token", ownerCsrf)
      .send({ email: "revoked@example.com", role: "VIEWER" })
      .expect(201);
    const revokedToken = String(inviteResponse.body.data.developmentUrl)
      .split("/")
      .at(-1);
    await ownerAgent
      .delete(`/tenants/acme/invitations/${inviteResponse.body.data.invitation.id}`)
      .set("x-csrf-token", ownerCsrf)
      .expect(200);
    await revokedAgent
      .post(`/invitations/${revokedToken}/accept`)
      .set("x-csrf-token", revokedCsrf)
      .expect(410);
  });
});
