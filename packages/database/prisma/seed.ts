import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const users = await Promise.all(
    ["owner", "admin", "member", "viewer"].map((name) =>
      prisma.user.upsert({
        where: { email: `${name}@example.com` },
        update: {},
        create: {
          name: `${name[0]?.toUpperCase()}${name.slice(1)} User`,
          email: `${name}@example.com`,
          passwordHash,
        },
      }),
    ),
  );

  const [owner, admin, member, viewer] = users;
  if (!owner || !admin || !member || !viewer) {
    throw new Error("Seed users were not created.");
  }

  const acme = await prisma.tenant.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Workspace", slug: "acme", createdById: owner.id },
  });
  const beta = await prisma.tenant.upsert({
    where: { slug: "beta" },
    update: {},
    create: { name: "Beta Workspace", slug: "beta", createdById: owner.id },
  });

  const memberships: Array<[string, string, Role]> = [
    [owner.id, acme.id, Role.OWNER],
    [admin.id, acme.id, Role.ADMIN],
    [member.id, acme.id, Role.MEMBER],
    [viewer.id, acme.id, Role.VIEWER],
    [owner.id, beta.id, Role.OWNER],
    [member.id, beta.id, Role.ADMIN],
  ];

  for (const [userId, tenantId, role] of memberships) {
    await prisma.membership.upsert({
      where: { userId_tenantId: { userId, tenantId } },
      update: { role },
      create: { userId, tenantId, role },
    });
  }

  await prisma.project.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      tenantId: acme.id,
      name: "Acme onboarding",
      description: "Demo tenant-scoped project.",
      createdById: owner.id,
      assignedToId: member.id,
      status: "ACTIVE",
    },
  });

  await prisma.project.upsert({
    where: { id: "00000000-0000-0000-0000-000000000201" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000201",
      tenantId: beta.id,
      name: "Beta launch checklist",
      description: "Second tenant project used in isolation tests.",
      createdById: owner.id,
      assignedToId: member.id,
      status: "PLANNED",
    },
  });

  console.log("Seed complete. Use SEED_PASSWORD from your local environment to sign in.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
