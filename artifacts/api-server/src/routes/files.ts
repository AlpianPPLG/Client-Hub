import { Router, IRouter } from "express";
import { db, filesTable, usersTable, projectsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import {
  ListProjectFilesParams,
  UploadProjectFileParams,
  UploadProjectFileBody,
  DeleteFileParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects/:projectId/files", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListProjectFilesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (user.role === "client" && project.clientId !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const fileRows = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.projectId, params.data.projectId))
    .orderBy(desc(filesTable.createdAt));

  const uploaderIds = [...new Set(fileRows.map((f) => f.uploadedBy))];
  const allUsers = uploaderIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, role: usersTable.role }).from(usersTable)
    : [];
  const userMap: Record<number, { name: string; role: string }> = {};
  for (const u of allUsers) {
    userMap[u.id] = { name: u.name, role: u.role };
  }

  res.json(
    fileRows.map((f) => ({
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
    }))
  );
});

router.post("/projects/:projectId/files", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = UploadProjectFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UploadProjectFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (user.role === "client" && project.clientId !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [file] = await db
    .insert(filesTable)
    .values({
      projectId: params.data.projectId,
      name: parsed.data.name,
      url: parsed.data.url,
      size: parsed.data.size ?? null,
      mimeType: parsed.data.mimeType ?? null,
      uploadedBy: user.id,
    })
    .returning();

  await logActivity({
    type: "file_uploaded",
    description: `${user.name} uploaded "${parsed.data.name}"`,
    userId: user.id,
    projectId: params.data.projectId,
    projectTitle: project.title,
  });

  res.status(201).json({
    id: file.id,
    projectId: file.projectId,
    name: file.name,
    url: file.url,
    size: file.size ?? null,
    mimeType: file.mimeType ?? null,
    uploadedBy: file.uploadedBy,
    uploaderName: user.name,
    uploaderRole: user.role,
    createdAt: file.createdAt,
  });
});

router.delete("/files/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = DeleteFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [file] = await db.select().from(filesTable).where(eq(filesTable.id, params.data.id));
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  if (user.role !== "admin" && file.uploadedBy !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  await db.delete(filesTable).where(eq(filesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
