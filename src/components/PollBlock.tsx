import { useState } from "react";
import { BarChart3, Check, Clock, Trash2 } from "lucide-react";
import { usePoll, useVotePoll, useRemovePollVote } from "@/hooks/usePolls";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PollBlock = ({ questionId }: { questionId: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: poll } = usePoll(questionId);
  const voteMut = useVotePoll(poll);
  const removeMut = useRemovePollVote(poll);
  const [showResults, setShowResults] = useState(false);

  if (!poll) return null;

  const closed = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;
  const userVoted = !!poll.user_vote_option_id;
  const reveal = userVoted || closed || showResults;
  const isAuthor = user?.id === poll.author_id;

  const handleDelete = async () => {
    if (!confirm("Supprimer ce sondage ?")) return;
    const { error } = await supabase.from("polls").delete().eq("id", poll.id);
    if (error) toast.error("Suppression impossible.");
    else {
      toast.success("Sondage supprimé.");
      qc.invalidateQueries({ queryKey: ["poll"] });
    }
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 my-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h4 className="font-mono text-sm font-bold text-foreground">{poll.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {closed ? (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Clos</span>
          ) : poll.ends_at ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Clock className="h-3 w-3" /> {new Date(poll.ends_at).toLocaleDateString()}
            </span>
          ) : null}
          {isAuthor && (
            <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct = poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0;
          const isMyVote = poll.user_vote_option_id === opt.id;
          if (reveal) {
            return (
              <div key={opt.id} className="relative">
                <div className="relative h-9 rounded-md border border-border bg-muted overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${isMyVote ? "bg-primary/30" : "bg-primary/15"} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex h-full items-center justify-between px-3">
                    <span className="text-sm text-foreground flex items-center gap-1.5">
                      {isMyVote && <Check className="h-3.5 w-3.5 text-primary" />}
                      {opt.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {pct}% <span className="text-muted-foreground font-normal">({opt.votes})</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <button
              key={opt.id}
              onClick={() => voteMut.mutate(opt.id)}
              disabled={voteMut.isPending}
              className="w-full text-left h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{poll.total_votes} vote{poll.total_votes > 1 ? "s" : ""}</span>
        <div className="flex items-center gap-3">
          {!reveal && (
            <button onClick={() => setShowResults(true)} className="hover:text-foreground transition-colors">
              Voir les résultats
            </button>
          )}
          {userVoted && !closed && (
            <button onClick={() => removeMut.mutate()} className="hover:text-destructive transition-colors">
              Retirer mon vote
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollBlock;
