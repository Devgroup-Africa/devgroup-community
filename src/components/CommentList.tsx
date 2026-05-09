import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageCircle, Trash2, Send } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import MentionTextarea from "./MentionTextarea";
import { extractMentions, renderWithMentions, resolveMentions } from "@/lib/mentions";
import { notifyMany, notify } from "@/lib/notify";
import { useIsAdmin } from "@/hooks/useRole";

interface CommentRow {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_username: string;
  author_avatar: string;
}

interface Props {
  targetType: "question" | "answer";
  targetId: string;
  questionId: string;
  /** Author of the parent (question or answer) — to be notified on a new comment */
  parentAuthorId?: string;
}

const CommentList = ({ targetType, targetId, questionId, parentAuthorId }: Props) => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", targetType, targetId],
    queryFn: async (): Promise<CommentRow[]> => {
      const { data } = await supabase
        .from("comments")
        .select("id, author_id, body, created_at, profiles!comments_author_id_fkey(username, avatar)")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: true });
      // Fallback if implicit join not detected — second pass
      if (!data || data.length === 0) {
        const { data: raw } = await supabase
          .from("comments")
          .select("id, author_id, body, created_at")
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .order("created_at", { ascending: true });
        if (!raw || raw.length === 0) return [];
        const ids = [...new Set(raw.map((c) => c.author_id))];
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, avatar")
          .in("id", ids);
        const map = new Map((profs || []).map((p) => [p.id, p]));
        return raw.map((c) => ({
          ...c,
          author_username: map.get(c.author_id)?.username ?? "anon",
          author_avatar: map.get(c.author_id)?.avatar ?? "??",
        }));
      }
      return (data as any[]).map((c) => ({
        id: c.id,
        author_id: c.author_id,
        body: c.body,
        created_at: c.created_at,
        author_username: c.profiles?.username ?? "anon",
        author_avatar: c.profiles?.avatar ?? "??",
      }));
    },
  });

  // Auto-open when there are comments
  useEffect(() => {
    if (comments.length > 0) setOpen(true);
  }, [comments.length]);

  // username -> id map for rendering mentions
  const usernameToId: Record<string, string> = {};
  comments.forEach((c) => {
    usernameToId[c.author_username.toLowerCase()] = c.author_id;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Connectez-vous pour commenter.");
      return;
    }
    const trimmed = body.trim();
    if (trimmed.length < 2) return;
    setSubmitting(true);
    const { data: inserted, error } = await supabase
      .from("comments")
      .insert({ author_id: user.id, target_type: targetType, target_id: targetId, body: trimmed })
      .select("id")
      .single();
    if (error) {
      setSubmitting(false);
      toast.error("Impossible de commenter.");
      return;
    }
    // Notifications: parent author + mentions
    const mentions = extractMentions(trimmed);
    const mentioned = await resolveMentions(mentions);
    const notified = new Set<string>();
    if (parentAuthorId && parentAuthorId !== user.id) {
      notified.add(parentAuthorId);
      await notify({
        user_id: parentAuthorId,
        actor_id: user.id,
        type: "comment",
        target_type: targetType,
        target_id: targetId,
        question_id: questionId,
        payload: { excerpt: trimmed.slice(0, 120) },
      });
    }
    const mentionNotifs = mentioned
      .filter((m) => m.id !== user.id && !notified.has(m.id))
      .map((m) => ({
        user_id: m.id,
        actor_id: user.id,
        type: "mention" as const,
        target_type: targetType,
        target_id: targetId,
        question_id: questionId,
        payload: { excerpt: trimmed.slice(0, 120) },
      }));
    await notifyMany(mentionNotifs);

    setBody("");
    setSubmitting(false);
    qc.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["comments", targetType, targetId] });
  };

  return (
    <div className="mt-3 border-t border-border pt-2">
      {comments.length > 0 && (
        <ul className="space-y-1.5">
          {comments.map((c) => (
            <li key={c.id} className="group flex gap-2 text-xs leading-relaxed">
              <Link
                to={`/user/${c.author_id}`}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground hover:ring-1 hover:ring-primary"
                title={c.author_username}
              >
                {c.author_avatar}
              </Link>
              <div className="min-w-0 flex-1">
                <span className="text-foreground/90 break-words">
                  <Link to={`/user/${c.author_id}`} className="font-semibold text-foreground hover:text-primary">
                    {c.author_username}
                  </Link>
                  <span className="mx-1 text-muted-foreground">·</span>
                  {renderWithMentions(c.body, usernameToId)}
                </span>
                <span className="ml-2 text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
              </div>
              {(user?.id === c.author_id || isAdmin) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  title="Supprimer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!open && comments.length === 0 ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="h-3 w-3" />
          Ajouter un commentaire
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 flex items-start gap-2">
          <MentionTextarea
            value={body}
            onChange={setBody}
            placeholder={user ? "Commenter… (@ pour mentionner)" : "Connectez-vous pour commenter"}
            disabled={!user || submitting}
            rows={1}
            maxLength={600}
            className="flex-1 rounded-md border border-border bg-muted px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!user || submitting || body.trim().length < 2}
            className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
          </button>
        </form>
      )}
      {open && comments.length === 0 && body.length === 0 && user && (
        <p className="mt-1 text-[10px] text-muted-foreground">Max 600 caractères.</p>
      )}
    </div>
  );
};

export default CommentList;
