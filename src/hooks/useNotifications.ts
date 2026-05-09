import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  target_type: string | null;
  target_id: string | null;
  question_id: string | null;
  payload: any;
  read: boolean;
  created_at: string;
  actor_username?: string;
  actor_avatar?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Notification[]> => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      const rows = (data || []) as Notification[];
      const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[])];
      if (actorIds.length === 0) return rows;
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, avatar")
        .in("id", actorIds);
      const map = new Map((profs || []).map((p) => [p.id, p]));
      return rows.map((r) => ({
        ...r,
        actor_username: r.actor_id ? map.get(r.actor_id)?.username : undefined,
        actor_avatar: r.actor_id ? map.get(r.actor_id)?.avatar : undefined,
      }));
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return query;
};

export const markAllNotificationsRead = async (userId: string) => {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
};

export const markNotificationRead = async (id: string) => {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
};
