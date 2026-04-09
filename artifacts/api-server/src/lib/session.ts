import { Request } from "express";
import { User } from "@workspace/db";

declare module "express-serve-static-core" {
  interface Request {
    session: {
      userId?: number;
    };
  }
}

export type AuthenticatedRequest = Request & {
  user: User;
};

export function getSessionUserId(req: Request): number | null {
  return req.session?.userId ?? null;
}
