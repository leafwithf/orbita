import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import {
  describeNotification,
  type NotificationView,
} from "@/modules/collab/domain";

export type NotificationItem = NotificationView & {
  id: string;
  read: boolean;
  createdAt: string;
};

export const countUnreadNotifications = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return error ? 0 : (count ?? 0);
});

export async function listNotifications(limit = 50): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (
    (data ?? []) as {
      id: string;
      type: string;
      payload: unknown;
      read_at: string | null;
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    read: row.read_at !== null,
    createdAt: row.created_at,
    ...describeNotification(row.type, row.payload),
  }));
}
