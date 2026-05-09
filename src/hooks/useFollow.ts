import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { notify } from "@/lib/notify";
import { toast } from "sonner";

export const useFollowState = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["follow", targetUserId, user?.id],
    enabled: !!user && !!targetUserId && user!.id !== targetUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId!)
        .maybeSingle();
      return !!data;
    },
  });
};

export const useFollowCounts = (userId: string | undefined) =>
  useQuery({
    queryKey: ["follow-counts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId!),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId!),
      ]);
      return { followers: followers ?? 0, following: following ?? 0 };
    },
  });

export const useToggleFollow = (targetUserId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      if (!user) throw new Error("not_authenticated");
      if (currentlyFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
        await notify({
          user_id: targetUserId,
          actor_id: user.id,
          type: "follow",
          target_type: "user",
          target_id: user.id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow", targetUserId] });
      qc.invalidateQueries({ queryKey: ["follow-counts", targetUserId] });
      qc.invalidateQueries({ queryKey: ["following-ids"] });
    },
    onError: (err: any) => {
      if (err?.message === "not_authenticated") toast.error("Connectez-vous pour suivre.");
      else toast.error("Action impossible.");
    },
  });
};

/** IDs of users the current user follows */
export const useFollowingIds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["following-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      return (data || []).map((r) => r.following_id);
    },
  });
};
