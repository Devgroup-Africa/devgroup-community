import { ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVote, useVoteMutation } from "@/hooks/useData";

interface Props {
  totalVotes: number;
  targetType: "question" | "answer";
  targetId: string;
}

const VoteButton = ({ totalVotes, targetType, targetId }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: userVote = 0 } = useUserVote(targetType, targetId);
  const mutation = useVoteMutation(targetType, targetId);

  const handleVote = (direction: 1 | -1) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const next = userVote === direction ? 0 : direction;
    mutation.mutate(next as -1 | 0 | 1);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={mutation.isPending}
        className={`rounded-md p-1 transition-colors ${
          userVote === 1
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:text-vote-up hover:bg-primary/10"
        }`}
        aria-label="Voter pour"
      >
        <ChevronUp className="h-6 w-6" />
      </button>
      <span className="text-xl font-bold font-mono text-foreground">{totalVotes}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={mutation.isPending}
        className={`rounded-md p-1 transition-colors ${
          userVote === -1
            ? "bg-destructive/20 text-destructive"
            : "text-muted-foreground hover:text-vote-down hover:bg-destructive/10"
        }`}
        aria-label="Voter contre"
      >
        <ChevronDown className="h-6 w-6" />
      </button>
    </div>
  );
};

export default VoteButton;
