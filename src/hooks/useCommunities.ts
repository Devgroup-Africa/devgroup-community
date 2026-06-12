import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type CommunityRole = "member" | "moderator" | "admin" | "mentor" | "cadet";
export type JoinRole = Extract<CommunityRole, "member" | "mentor" | "cadet">;

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar: string | null;
  banner_url: string | null;
  is_private: boolean;
  owner_id: string;
  member_count: number;
  created_at: string;
};

export const useCommunities = () =>
  useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("member_count", { ascending: false });
      if (error) throw error;
      return (data || []) as Community[];
    },
  });

export const useCommunity = (slug: string | undefined) =>
  useQuery({
    queryKey: ["community", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return (data as Community) || null;
    },
  });

export type MemberRow = {
  community_id: string;
  user_id: string;
  role: CommunityRole;
  joined_at: string;
  profile?: { username: string; avatar: string; reputation: number } | null;
};

export const useCommunityMembers = (communityId: string | undefined) =>
  useQuery({
    queryKey: ["community-members", communityId],
    enabled: !!communityId,
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from("community_members")
        .select("*")
        .eq("community_id", communityId!)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      const rows = (members || []) as Omit<MemberRow, "profile">[];
      if (rows.length === 0) return [] as MemberRow[];
      const ids = rows.map((r) => r.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,username,avatar,reputation")
        .in("id", ids);
      const byId = new Map((profs || []).map((p: any) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) || null })) as MemberRow[];
    },
  });


export const useMyMemberships = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-memberships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id, role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []) as { community_id: string; role: CommunityRole }[];
    },
  });
};

export const useJoinCommunity = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { communityId: string; role?: JoinRole }) => {
      if (!user) throw new Error("Connectez-vous");
      const { error } = await supabase
        .from("community_members")
        .insert({
          community_id: input.communityId,
          user_id: user.id,
          role: (input.role || "member") as any,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-memberships"] });
      qc.invalidateQueries({ queryKey: ["communities"] });
      qc.invalidateQueries({ queryKey: ["community-members"] });
      qc.invalidateQueries({ queryKey: ["community"] });
      qc.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Vous avez rejoint la communauté.");
    },
    onError: (e: any) => toast.error(e?.message || "Impossible de rejoindre."),
  });
};

export const useLeaveCommunity = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (communityId: string) => {
      if (!user) throw new Error("Connectez-vous");
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-memberships"] });
      qc.invalidateQueries({ queryKey: ["communities"] });
      qc.invalidateQueries({ queryKey: ["community-members"] });
      qc.invalidateQueries({ queryKey: ["community"] });
      toast.success("Vous avez quitté la communauté.");
    },
    onError: (e: any) => toast.error(e?.message || "Impossible de quitter."),
  });
};

export const useCreateCommunity = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      slug: string;
      description?: string;
      is_private?: boolean;
    }) => {
      if (!user) throw new Error("Connectez-vous");
      const avatar = input.name.slice(0, 2).toUpperCase();
      const { data, error } = await supabase
        .from("communities")
        .insert({
          name: input.name,
          slug: input.slug,
          description: input.description || null,
          is_private: !!input.is_private,
          owner_id: user.id,
          avatar,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Community;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      qc.invalidateQueries({ queryKey: ["my-memberships"] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { community_id: string; user_id: string; role: CommunityRole }) => {
      const { error } = await supabase
        .from("community_members")
        .update({ role: input.role })
        .eq("community_id", input.community_id)
        .eq("user_id", input.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-members"] });
    },
    onError: (e: any) => toast.error(e?.message || "Action impossible."),
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { community_id: string; user_id: string }) => {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", input.community_id)
        .eq("user_id", input.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-members"] });
      qc.invalidateQueries({ queryKey: ["communities"] });
    },
    onError: (e: any) => toast.error(e?.message || "Action impossible."),
  });
};

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
