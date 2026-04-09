import { Router, IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";
import { LoginBody, RegisterBody } from "@workspace/api-zod";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt_portal_2024").digest("hex");
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    company: user.company ?? null,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt,
  };
}

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));

  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  res.json({ user: formatUser(user), token: "session" });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, company } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role: "client",
      company: company ?? null,
    })
    .returning();

  req.session.userId = user.id;
  res.status(201).json({ user: formatUser(user), token: "session" });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.userId = undefined;
  res.json({ success: true });
});

export default router;
