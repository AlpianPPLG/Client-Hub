import { Router, IRouter } from "express";
import { db, projectsTable, usersTable, filesTable, commentsTable } from "@workspace/db";
import { eq, and, desc, count, SQL } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import {
  ListProjectsQueryParams,
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getClientName(clientId: number): Promise<string> {
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, clientId));
  return user?.name ?? "Unknown";
}

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const query = ListProjectsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, clientId, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (user.role === "client") {
    conditions.push(eq(projectsTable.clientId, user.id));
  } else if (clientId != null) {
    conditions.push(eq(projectsTable.clientId, clientId));
  }
  if (status) {
    conditions.push(eq(projectsTable.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [projectRows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(projectsTable)
      .where(whereClause)
      .orderBy(desc(projectsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(projectsTable).where(whereClause),
  ]);

  const clientIds = [...new Set(projectRows.map((p) => p.clientId))];
  const clientMap: Record<number, string> = {};
  if (clientIds.length > 0) {
    const clients = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    for (const c of clients) {
      clientMap[c.id] = c.name;
    }
  }

  const projects = projectRows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    priority: p.priority,
    clientId: p.clientId,
    clientName: clientMap[p.clientId] ?? "Unknown",
    budget: p.budget != null ? parseFloat(p.budget) : null,
    deadline: p.deadline ?? null,
    completedAt: p.completedAt ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  res.json({ projects, total: Number(total), page, limit });
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, clientId, status, priority, budget, deadline } = parsed.data;

  const [project] = await db
    .insert(projectsTable)
    .values({
      title,
      description,
      clientId,
      status: status ?? "pending",
      priority: priority ?? "medium",
      budget: budget != null ? String(budget) : null,
      deadline: deadline ?? null,
    })
    .returning();

  const clientName = await getClientName(clientId);
  await logActivity({
    type: "project_created",
    description: `Project "${title}" was created`,
    userId: user.id,
    projectId: project.id,
    projectTitle: title,
  });

  res.status(201).json({
    ...project,
    clientName,
    budget: project.budget != null ? parseFloat(project.budget) : null,
  });
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (user.role === "client" && project.clientId !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [clientName, filesRows, commentsRows] = await Promise.all([
    getClientName(project.clientId),
    db.select().from(filesTable).where(eq(filesTable.projectId, project.id)).orderBy(desc(filesTable.createdAt)),
    db.select().from(commentsTable).where(eq(commentsTable.projectId, project.id)).orderBy(commentsTable.createdAt),
  ]);

  const uploaderIds = [...new Set(filesRows.map((f) => f.uploadedBy))];
  const commentAuthorIds = [...new Set(commentsRows.map((c) => c.authorId))];
  const allUserIds = [...new Set([...uploaderIds, ...commentAuthorIds])];
  const allUsers = allUserIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, role: usersTable.role }).from(usersTable)
    : [];
  const userMap: Record<number, { name: string; role: string }> = {};
  for (const u of allUsers) {
    userMap[u.id] = { name: u.name, role: u.role };
  }

  res.json({
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    priority: project.priority,
    clientId: project.clientId,
    clientName,
    budget: project.budget != null ? parseFloat(project.budget) : null,
    deadline: project.deadline ?? null,
    completedAt: project.completedAt ?? null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    files: filesRows.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      name: f.name,
      url: f.url,
      size: f.size ?? null,
      mimeType: f.mimeType ?? null,
      uploadedBy: f.uploadedBy,
      uploaderName: userMap[f.uploadedBy]?.name ?? "Unknown",
      uploaderRole: userMap[f.uploadedBy]?.role ?? "client",
      createdAt: f.createdAt,
    })),
    comments: commentsRows.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      content: c.content,
      authorId: c.authorId,
      authorName: userMap[c.authorId]?.name ?? "Unknown",
      authorRole: userMap[c.authorId]?.role ?? "client",
      createdAt: c.createdAt,
    })),
  });
});

router.patch("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (user.role === "client" && existing.clientId !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title != null) updateData.title = parsed.data.title;
  if (parsed.data.description != null) updateData.description = parsed.data.description;
  if (parsed.data.status != null) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "completed") {
      updateData.completedAt = new Date();
    }
  }
  if (parsed.data.priority != null) updateData.priority = parsed.data.priority;
  if ("budget" in parsed.data) updateData.budget = parsed.data.budget != null ? String(parsed.data.budget) : null;
  if ("deadline" in parsed.data) updateData.deadline = parsed.data.deadline ?? null;

  const [updated] = await db.update(projectsTable).set(updateData).where(eq(projectsTable.id, params.data.id)).returning();

  if (parsed.data.status && parsed.data.status !== existing.status) {
    await logActivity({
      type: "status_changed",
      description: `Project "${updated.title}" status changed to ${parsed.data.status}`,
      userId: user.id,
      projectId: updated.id,
      projectTitle: updated.title,
    });
  } else {
    await logActivity({
      type: "project_updated",
      description: `Project "${updated.title}" was updated`,
      userId: user.id,
      projectId: updated.id,
      projectTitle: updated.title,
    });
  }

  const clientName = await getClientName(updated.clientId);
  res.json({
    ...updated,
    clientName,
    budget: updated.budget != null ? parseFloat(updated.budget) : null,
  });
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
