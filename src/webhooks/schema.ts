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
]);

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
