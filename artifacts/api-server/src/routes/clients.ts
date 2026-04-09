import { Router, IRouter } from "express";
import { db, usersTable, projectsTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import {
  ListClientsQueryParams,
  GetClientParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/clients", requireAdmin, async (req, res): Promise<void> => {
  const query = ListClientsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const [clientRows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "client"))
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "client")),
  ]);

  const allProjects = await db.select({ clientId: projectsTable.clientId, status: projectsTable.status }).from(projectsTable);
  
  const projectsByClient: Record<number, { total: number; active: number }> = {};
  for (const p of allProjects) {
    if (!projectsByClient[p.clientId]) {
      projectsByClient[p.clientId] = { total: 0, active: 0 };
    }
    projectsByClient[p.clientId].total++;
    if (p.status === "in_progress" || p.status === "pending" || p.status === "review") {
      projectsByClient[p.clientId].active++;
    }
  }

  const clients = clientRows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company ?? null,
    projectCount: projectsByClient[c.id]?.total ?? 0,
    activeProjects: projectsByClient[c.id]?.active ?? 0,
    createdAt: c.createdAt,
  }));

  res.json({ clients, total: Number(total), page, limit });
});

router.get("/clients/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!client || client.role !== "client") {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.clientId, params.data.id))
    .orderBy(desc(projectsTable.createdAt));

  res.json({
    id: client.id,
    name: client.name,
    email: client.email,
    company: client.company ?? null,
    projectCount: projects.length,
    activeProjects: projects.filter((p) => ["in_progress", "pending", "review"].includes(p.status)).length,
    createdAt: client.createdAt,
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      priority: p.priority,
      clientId: p.clientId,
      clientName: client.name,
      budget: p.budget != null ? parseFloat(p.budget) : null,
      deadline: p.deadline ?? null,
      completedAt: p.completedAt ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
});

export default router;
