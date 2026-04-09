import { db, activityTable } from "@workspace/db";

type ActivityType =
  | "project_created"
  | "project_updated"
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "comment_added"
  | "file_uploaded"
  | "status_changed";

export async function logActivity(params: {
  type: ActivityType;
  description: string;
  userId: number;
  projectId?: number;
  projectTitle?: string;
}): Promise<void> {
  await db.insert(activityTable).values({
    type: params.type,
    description: params.description,
    userId: params.userId,
    projectId: params.projectId ?? null,
    projectTitle: params.projectTitle ?? null,
  });
}
