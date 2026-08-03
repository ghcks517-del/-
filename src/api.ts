import { Regulation, Revision, SyncRun, SyncRunItem, AuditLog } from "./types/index";

const API_BASE = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "API request failed");
  }
  return res.json();
}

export const api = {
  regulations: {
    list: () => fetchJSON<Regulation[]>("/regulations"),
    create: (data: Partial<Regulation>) =>
      fetchJSON<Regulation>("/regulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Regulation>) =>
      fetchJSON<{ success: boolean }>(`/regulations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJSON<{ success: boolean }>(`/regulations/${id}`, { method: "DELETE" }),
  },
  sync: {
    runMonthly: (year?: number, month?: number) =>
      fetchJSON<{ message: string }>("/jobs/monthly-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      }),
    deleteRun: (id: string) =>
      fetchJSON<{ success: boolean }>(`/sync-runs/${id}`, { method: "DELETE" }),
  },
};
