import { Router, IRouter } from "express";
import { db, requestsTable, usersTable } from "@workspace/db";
import { eq, and, desc, count, SQL } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import {
  ListRequestsQueryParams,
  CreateRequestBody,
  GetRequestParams,
  UpdateRequestParams,
  UpdateRequestBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getClientName(clientId: number): Promise<string> {
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, clientId));
  return user?.name ?? "Unknown";
}

router.get("/requests", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const query = ListRequestsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, page = 1, limit = 20 } = query.data;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (user.role === "client") {
    conditions.push(eq(requestsTable.clientId, user.id));
  }
  if (status) {
    conditions.push(eq(requestsTable.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(requestsTable)
      .where(whereClause)
      .orderBy(desc(requestsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(requestsTable).where(whereClause),
  ]);

  const allClients = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  const clientMap: Record<number, string> = {};
  for (const c of allClients) {
    clientMap[c.id] = c.name;
  }

  const requests = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    serviceType: r.serviceType,
    budget: r.budget != null ? parseFloat(r.budget) : null,
    timeline: r.timeline ?? null,
    status: r.status,
    clientId: r.clientId,
    clientName: clientMap[r.clientId] ?? "Unknown",
    adminNotes: r.adminNotes ?? null,
    projectId: r.projectId ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  res.json({ requests, total: Number(total), page, limit });
});

router.post("/requests", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, serviceType, budget, timeline } = parsed.data;

  const [request] = await db
    .insert(requestsTable)
    .values({
      title,
      description,
      serviceType,
      budget: budget != null ? String(budget) : null,
      timeline: timeline ?? null,
      status: "pending",
      clientId: user.id,
    })
    .returning();

  await logActivity({
    type: "request_submitted",
    description: `${user.name} submitted a request: "${title}"`,
    userId: user.id,
  });

  const clientName = await getClientName(user.id);
  res.status(201).json({
    ...request,
    clientName,
    budget: request.budget != null ? parseFloat(request.budget) : null,
    timeline: request.timeline ?? null,
    adminNotes: request.adminNotes ?? null,
    projectId: request.projectId ?? null,
  });
});

router.get("/requests/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = GetRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [request] = await db.select().from(requestsTable).where(eq(requestsTable.id, params.data.id));
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (user.role === "client" && request.clientId !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const clientName = await getClientName(request.clientId);
  res.json({
    ...request,
    clientName,
    budget: request.budget != null ? parseFloat(request.budget) : null,
    timeline: request.timeline ?? null,
    adminNotes: request.adminNotes ?? null,
    projectId: request.projectId ?? null,
  });
});

router.patch("/requests/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const params = UpdateRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(requestsTable).where(eq(requestsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status != null) updateData.status = parsed.data.status;
  if (parsed.data.adminNotes != null) updateData.adminNotes = parsed.data.adminNotes;
  if ("projectId" in parsed.data) updateData.projectId = parsed.data.projectId ?? null;

  const [updated] = await db
    .update(requestsTable)
    .set(updateData)
    .where(eq(requestsTable.id, params.data.id))
    .returning();

  if (parsed.data.status === "approved") {
    await logActivity({
      type: "request_approved",
      description: `Request "${updated.title}" was approved`,
      userId: user.id,
    });
  } else if (parsed.data.status === "rejected") {
    await logActivity({
      type: "request_rejected",
      description: `Request "${updated.title}" was rejected`,
      userId: user.id,
    });
  }

  const clientName = await getClientName(updated.clientId);
  res.json({
    ...updated,
    clientName,
    budget: updated.budget != null ? parseFloat(updated.budget) : null,
    timeline: updated.timeline ?? null,
    adminNotes: updated.adminNotes ?? null,
    projectId: updated.projectId ?? null,
  });
});

export default router;
