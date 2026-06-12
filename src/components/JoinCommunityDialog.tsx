import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { GraduationCap, Sprout, Users as UsersIcon } from "lucide-react";
import { JoinRole, useJoinCommunity } from "@/hooks/useCommunities";

const ROLES: {
  key: JoinRole;
  label: string;
  desc: string;
  Icon: typeof UsersIcon;
}[] = [
  {
    key: "mentor",
    label: "Mentor",
    desc: "J'aide les cadets, je partage mon expérience et je réponds aux questions.",
    Icon: GraduationCap,
  },
  {
    key: "cadet",
    label: "Cadet",
    desc: "Je découvre, je pose des questions et je cherche du mentorat.",
    Icon: Sprout,
  },
  {
    key: "member",
    label: "Membre",
    desc: "Je participe librement : je peux aider et demander de l'aide.",
    Icon: UsersIcon,
  },
];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  communityId: string;
  communityName: string;
};

export default function JoinCommunityDialog({ open, onOpenChange, communityId, communityName }: Props) {
  const [role, setRole] = useState<JoinRole>("member");
  const join = useJoinCommunity();

  const handleJoin = async () => {
    try {
      await join.mutateAsync({ communityId, role });
      onOpenChange(false);
    } catch {
      /* toast handled in hook */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejoindre {communityName}</DialogTitle>
          <DialogDescription>Choisissez le rôle qui vous correspond le mieux.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {ROLES.map(({ key, label, desc, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className={`w-full flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                role === key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Icon className={`h-5 w-5 mt-0.5 ${role === key ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${role === key ? "text-primary" : "text-foreground"}`}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground"
          >
            Annuler
          </button>
          <button
            onClick={handleJoin}
            disabled={join.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {join.isPending ? "…" : "Rejoindre"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
