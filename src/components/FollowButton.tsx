import { UserPlus, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowState, useToggleFollow } from "@/hooks/useFollow";

const FollowButton = ({ userId }: { userId: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: following = false } = useFollowState(userId);
  const toggle = useToggleFollow(userId);

  if (user?.id === userId) return null;

  const handleClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    toggle.mutate(following);
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggle.isPending}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        following
          ? "border border-border bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {following ? (
        <>
          <UserCheck className="h-3.5 w-3.5" />
          Suivi
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" />
          Suivre
        </>
      )}
    </button>
  );
};

export default FollowButton;
