import { Router, IRouter } from "express";
import { db, commentsTable, usersTable, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import {
  ListCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  DeleteCommentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects/:projectId/comments", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListCommentsParams.safeParse(req.params);
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

  const commentRows = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.projectId, params.data.projectId))
    .orderBy(commentsTable.createdAt);

  const authorIds = [...new Set(commentRows.map((c) => c.authorId))];
  const allUsers = authorIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, role: usersTable.role }).from(usersTable)
    : [];
  const userMap: Record<number, { name: string; role: string }> = {};
  for (const u of allUsers) {
    userMap[u.id] = { name: u.name, role: u.role };
  }

  res.json(
    commentRows.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      content: c.content,
      authorId: c.authorId,
      authorName: userMap[c.authorId]?.name ?? "Unknown",
      authorRole: userMap[c.authorId]?.role ?? "client",
      createdAt: c.createdAt,
    }))
  );
});

router.post("/projects/:projectId/comments", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateCommentBody.safeParse(req.body);
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

  const [comment] = await db
    .insert(commentsTable)
    .values({
      projectId: params.data.projectId,
      content: parsed.data.content,
      authorId: user.id,
    })
    .returning();

  await logActivity({
    type: "comment_added",
    description: `${user.name} commented on "${project.title}"`,
    userId: user.id,
    projectId: params.data.projectId,
    projectTitle: project.title,
  });

  res.status(201).json({
    id: comment.id,
    projectId: comment.projectId,
    content: comment.content,
    authorId: comment.authorId,
    authorName: user.name,
    authorRole: user.role,
    createdAt: comment.createdAt,
  });
});

router.delete("/comments/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, params.data.id));
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  if (user.role !== "admin" && comment.authorId !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
