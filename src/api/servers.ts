import { client } from "./client";

export interface Server {
  id: number;
  name: string;
  description?: string;
  protocol: "http" | "https" | "tcp" | "ping" | "icmp";
  host: string;
  port: number;
  path?: string;
  check_interval?: number;
  timeout?: number;
  status?: "up" | "down" | "degraded" | "unknown";
  /** Comma-separated tags, e.g. "web,prod" */
  tags?: string;
  notify_on_failure?: boolean;
  notify_recovery?: boolean;
  full_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type ServerPayload = Omit<Server, "id" | "full_url" | "created_at" | "updated_at">;

export const serversApi = {
  list: () => client.get<Server[]>("/servers/").then((r) => r.data),
  get: (id: number) => client.get<Server>(`/servers/${id}/`).then((r) => r.data),
  create: (data: ServerPayload) => client.post<Server>("/servers/", data).then((r) => r.data),
  update: (id: number, data: Partial<ServerPayload>) =>
    client.patch<Server>(`/servers/${id}/`, data).then((r) => r.data),
  remove: (id: number) => client.delete(`/servers/${id}/`),
};
