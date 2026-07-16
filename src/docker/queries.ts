import { z } from "zod";
import type { DockerClient } from "./client.js";

const containerListSchema = z.array(
  z.object({
    Names: z.array(z.string()),
    Image: z.string(),
    State: z.string(),
    Status: z.string(),
  }),
);

export interface ContainerSummary {
  name: string;
  image: string;
  state: string;
  status: string;
}

export async function listContainers(client: DockerClient): Promise<ContainerSummary[]> {
  const raw = await client.get("/containers/json?all=true");
  return containerListSchema.parse(raw).map((c) => ({
    name: c.Names[0]?.replace(/^\//, "") ?? "(sin nombre)",
    image: c.Image,
    state: c.State,
    status: c.Status,
  }));
}

const infoSchema = z.object({
  Name: z.string(),
  ServerVersion: z.string(),
  Containers: z.number(),
  ContainersRunning: z.number(),
  ContainersPaused: z.number(),
  ContainersStopped: z.number(),
  Images: z.number(),
});

export type DockerInfo = z.infer<typeof infoSchema>;

export async function getInfo(client: DockerClient): Promise<DockerInfo> {
  const raw = await client.get("/info");
  return infoSchema.parse(raw);
}
