import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Globe, Loader2, Lock, UserPlus, Users } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useAcceptCommunityInviteLink, useCommunityInvitePreview } from "@/hooks/useCommunities";

export default function CommunityInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: preview, isLoading } = useCommunityInvitePreview(token);
  const accept = useAcceptCommunityInviteLink();

  useEffect(() => {
    if (!authLoading && !user && token) {
      navigate(`/auth?next=${encodeURIComponent(`/invite/community/${token}`)}`, { replace: true });
    }
  }, [authLoading, user, token, navigate]);

  if (isLoading || authLoading) {
    return <Layout><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div></Layout>;
  }

  if (!preview) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-bold">Lien d'invitation invalide</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ce lien n'existe plus ou son créateur a quitté la communauté.</p>
          <Link to="/communities" className="mt-4 inline-block text-sm text-primary hover:underline">Voir les communautés</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary/15 text-lg font-bold text-primary">
            {preview.community_avatar || preview.community_name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-xs text-muted-foreground">{preview.inviter_username} vous invite à rejoindre</p>
            <h1 className="text-xl font-bold">{preview.community_name}</h1>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {preview.community_is_private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              {preview.community_is_private ? "Privée" : "Publique"} · <Users className="h-3 w-3" /> {preview.community_member_count} membres
            </p>
          </div>
        </div>
        {preview.community_description && <p className="mt-5 text-sm text-muted-foreground">{preview.community_description}</p>}
        <button
          onClick={() => token && accept.mutate(token)}
          disabled={!user || accept.isPending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {accept.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Rejoindre la communauté
        </button>
      </div>
    </Layout>
  );
}
