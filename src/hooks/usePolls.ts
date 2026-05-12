import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  position: number;
  votes: number;
}

export interface Poll {
  id: string;
  question_id: string;
  author_id: string;
  title: string;
  ends_at: string | null;
  created_at: string;
  options: PollOption[];
  total_votes: number;
  user_vote_option_id: string | null;
}

export const usePoll = (questionId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["poll", questionId, user?.id],
    enabled: !!questionId,
    queryFn: async (): Promise<Poll | null> => {
      const { data: poll } = await supabase
        .from("polls")
        .select("*")
        .eq("question_id", questionId!)
        .maybeSingle();
      if (!poll) return null;
      const { data: options = [] } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll.id)
        .order("position");
      const { data: votes = [] } = await supabase
        .from("poll_votes")
        .select("option_id, user_id")
        .eq("poll_id", poll.id);
      const counts = new Map<string, number>();
      (votes || []).forEach((v: any) => counts.set(v.option_id, (counts.get(v.option_id) || 0) + 1));
      const userVote = (votes || []).find((v: any) => v.user_id === user?.id);
      return {
        ...(poll as any),
        options: (options || []).map((o: any) => ({ ...o, votes: counts.get(o.id) || 0 })),
        total_votes: (votes || []).length,
        user_vote_option_id: userVote?.option_id || null,
      };
    },
  });
};

export const useVotePoll = (poll: Poll | null | undefined) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (optionId: string) => {
      if (!user) throw new Error("not_authenticated");
      if (!poll) throw new Error("no_poll");
      const { error } = await supabase
        .from("poll_votes")
        .upsert(
          { poll_id: poll.id, user_id: user.id, option_id: optionId },
          { onConflict: "poll_id,user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["poll"] });
    },
    onError: (err: any) => {
      if (err?.message === "not_authenticated") toast.error("Connectez-vous pour voter.");
      else toast.error("Impossible d'enregistrer le vote.");
    },
  });
};

export const useRemovePollVote = (poll: Poll | null | undefined) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user || !poll) return;
      await supabase.from("poll_votes").delete().eq("poll_id", poll.id).eq("user_id", user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["poll"] }),
  });
};
