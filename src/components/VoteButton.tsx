import { ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

const VoteButton = ({ initialVotes }: { initialVotes: number }) => {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);

  const handleVote = (direction: 1 | -1) => {
    if (userVote === direction) {
      setVotes(votes - direction);
      setUserVote(0);
    } else {
      setVotes(initialVotes + direction);
      setUserVote(direction);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        className={`rounded-md p-1 transition-colors ${
          userVote === 1
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:text-vote-up hover:bg-primary/10"
        }`}
      >
        <ChevronUp className="h-6 w-6" />
      </button>
      <span className="text-xl font-bold font-mono text-foreground">{votes}</span>
      <button
        onClick={() => handleVote(-1)}
        className={`rounded-md p-1 transition-colors ${
          userVote === -1
            ? "bg-destructive/20 text-destructive"
            : "text-muted-foreground hover:text-vote-down hover:bg-destructive/10"
        }`}
      >
        <ChevronDown className="h-6 w-6" />
      </button>
    </div>
  );
};

export default VoteButton;
