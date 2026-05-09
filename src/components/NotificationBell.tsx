import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, MessageCircle, MessageSquare, AtSign, CheckCircle2, UserPlus, Award, Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/timeAgo";

const TYPE_META: Record<string, { icon: typeof Bell; label: (n: Notification) => string }> = {
  answer: { icon: MessageSquare, label: (n) => `${n.actor_username ?? "Quelqu'un"} a répondu à votre question` },
  comment: { icon: MessageCircle, label: (n) => `${n.actor_username ?? "Quelqu'un"} a commenté votre publication` },
  mention: { icon: AtSign, label: (n) => `${n.actor_username ?? "Quelqu'un"} vous a mentionné` },
  accepted: { icon: CheckCircle2, label: () => `Votre réponse a été acceptée` },
  follow: { icon: UserPlus, label: (n) => `${n.actor_username ?? "Quelqu'un"} vous suit désormais` },
  vote: { icon: Heart, label: (n) => `${n.actor_username ?? "Quelqu'un"} a voté pour votre publication` },
  badge: { icon: Award, label: (n) => `Nouveau badge débloqué !` },
};

const targetUrl = (n: Notification): string => {
  if (n.type === "follow" && n.actor_id) return `/user/${n.actor_id}`;
  if (n.question_id) return `/question/${n.question_id}`;
  if (n.target_type === "user" && n.target_id) return `/user/${n.target_id}`;
  return "/";
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: notifications = [] } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!user) return null;
  const unread = notifications.filter((n) => !n.read).length;

  const handleOpen = (n: Notification) => {
    setOpen(false);
    if (!n.read) {
      markNotificationRead(n.id).then(() =>
        qc.invalidateQueries({ queryKey: ["notifications", user.id] })
      );
    }
    navigate(targetUrl(n));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(user.id);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-md border border-border bg-card shadow-lg overflow-hidden animate-fade-in z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Notifications</h4>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                Pas encore de notifications.
              </p>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const meta = TYPE_META[n.type] ?? { icon: Bell, label: () => n.type };
                  const Icon = meta.icon;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => handleOpen(n)}
                        className={`w-full flex gap-2 px-3 py-2.5 text-left text-xs hover:bg-secondary transition-colors border-b border-border/50 ${
                          !n.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${!n.read ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground/90 leading-snug">{meta.label(n)}</p>
                          {n.payload?.excerpt && (
                            <p className="mt-0.5 text-muted-foreground italic line-clamp-2">"{n.payload.excerpt}"</p>
                          )}
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
