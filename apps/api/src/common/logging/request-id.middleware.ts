import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";

export class RequestIdMiddleware {
  use = (req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
    const requestId = req.header("x-request-id") ?? `req_${nanoid(12)}`;
    const start = Date.now();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
      const safeLog = {
        requestId,
        method: req.method,
        route: sanitizeRoute(req.originalUrl),
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      };
      console.log(JSON.stringify(safeLog));
    });
    next();
  };
}

export function sanitizeRoute(route: string) {
  return route.replace(/\/invitations\/[^/]+\/accept/g, "/invitations/[redacted]/accept");
}
