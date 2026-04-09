import { Router, IRouter } from "express";
import { db, projectsTable, usersTable, requestsTable, activityTable } from "@workspace/db";
import { eq, and, count, sum, desc, gte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (user.role === "admin") {
    const [
      [{ totalProjects }],
      [{ activeProjects }],
      [{ completedProjects }],
      [{ pendingRequests }],
      [{ totalClients }],
      revenueResult,
      monthlyRevenueResult,
      [{ projectsThisMonth }],
    ] = await Promise.all([
      db.select({ totalProjects: count() }).from(projectsTable),
      db
        .select({ activeProjects: count() })
        .from(projectsTable)
        .where(sql`${projectsTable.status} IN ('pending', 'in_progress', 'review')`),
      db
        .select({ completedProjects: count() })
        .from(projectsTable)
        .where(eq(projectsTable.status, "completed")),
      db
        .select({ pendingRequests: count() })
        .from(requestsTable)
        .where(eq(requestsTable.status, "pending")),
      db
        .select({ totalClients: count() })
        .from(usersTable)
        .where(eq(usersTable.role, "client")),
      db
        .select({ total: sum(projectsTable.budget) })
        .from(projectsTable)
        .where(eq(projectsTable.status, "completed")),
      db
        .select({ total: sum(projectsTable.budget) })
        .from(projectsTable)
        .where(and(eq(projectsTable.status, "completed"), gte(projectsTable.completedAt, startOfMonth))),
      db
        .select({ projectsThisMonth: count() })
        .from(projectsTable)
        .where(gte(projectsTable.createdAt, startOfMonth)),
    ]);

    res.json({
      totalProjects: Number(totalProjects),
      activeProjects: Number(activeProjects),
      completedProjects: Number(completedProjects),
      pendingRequests: Number(pendingRequests),
      totalClients: Number(totalClients),
      totalRevenue: parseFloat(revenueResult[0]?.total ?? "0") || 0,
      revenueThisMonth: parseFloat(monthlyRevenueResult[0]?.total ?? "0") || 0,
      projectsThisMonth: Number(projectsThisMonth),
    });
  } else {
    const [
      [{ totalProjects }],
      [{ activeProjects }],
      [{ completedProjects }],
      [{ pendingRequests }],
    ] = await Promise.all([
      db.select({ totalProjects: count() }).from(projectsTable).where(eq(projectsTable.clientId, user.id)),
      db
        .select({ activeProjects: count() })
        .from(projectsTable)
        .where(and(eq(projectsTable.clientId, user.id), sql`${projectsTable.status} IN ('pending', 'in_progress', 'review')`)),
      db
        .select({ completedProjects: count() })
        .from(projectsTable)
        .where(and(eq(projectsTable.clientId, user.id), eq(projectsTable.status, "completed"))),
      db
        .select({ pendingRequests: count() })
        .from(requestsTable)
        .where(and(eq(requestsTable.clientId, user.id), eq(requestsTable.status, "pending"))),
    ]);

    res.json({
      totalProjects: Number(totalProjects),
      activeProjects: Number(activeProjects),
      completedProjects: Number(completedProjects),
      pendingRequests: Number(pendingRequests),
      totalClients: 0,
      totalRevenue: 0,
      revenueThisMonth: 0,
      projectsThisMonth: 0,
    });
  }
});

router.get("/dashboard/activity", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const limitParam = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const limit = isNaN(limitParam) ? 10 : Math.min(limitParam, 50);

  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(limit);

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const allUsers = userIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable)
    : [];
  const userMap: Record<number, string> = {};
  for (const u of allUsers) {
    userMap[u.id] = u.name;
  }

  res.json(
    rows.map((r) => ({
      id: r.id,
      type: r.type,
      description: r.description,
      projectId: r.projectId ?? null,
      projectTitle: r.projectTitle ?? null,
      userId: r.userId,
      userName: userMap[r.userId] ?? "Unknown",
      createdAt: r.createdAt,
    }))
  );
});

router.get("/dashboard/project-status-breakdown", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const statuses = ["pending", "in_progress", "review", "completed", "cancelled"] as const;
  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    review: "In Review",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const results = await Promise.all(
    statuses.map(async (status) => {
      const whereClause = user.role === "admin"
        ? eq(projectsTable.status, status)
        : and(eq(projectsTable.status, status), eq(projectsTable.clientId, user.id));
      const [{ cnt }] = await db.select({ cnt: count() }).from(projectsTable).where(whereClause);
      return { status, count: Number(cnt), label: labels[status] };
    })
  );

  res.json(results);
});

export default router;
