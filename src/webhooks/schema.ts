import { z } from "zod";

export const webhookEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("deploy"),
    service: z.string().min(1),
    status: z.enum(["success", "failure"]),
    version: z.string().optional(),
    detail: z.string().optional(),
  }),
  z.object({
    type: z.literal("resource_alert"),
    host: z.string().min(1),
    metric: z.enum(["cpu", "memory", "disk"]),
    value: z.number(),
    threshold: z.number(),
  }),
  z.object({
    type: z.literal("container_down"),
    container: z.string().min(1),
    exitCode: z.number().int().optional(),
  }),
  z.object({
    type: z.literal("container_restarted"),
    container: z.string().min(1),
  }),
  z.object({
    type: z.literal("job_dlq"),
    service: z.string().min(1),
    queue: z.string().min(1),
    jobId: z.string().min(1),
    name: z.string().min(1),
    failedReason: z.string(),
    attemptsMade: z.number().int(),
    failedAt: z.string(),
  }),
  z.object({
    type: z.literal("contact"),
    name: z.string().min(1).max(100),
    email: z.string().email().max(200),
    message: z.string().min(1).max(2000),
  }),
]);

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
