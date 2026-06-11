import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  useCommunities,
  useMyMemberships,
  useJoinCommunity,
  useLeaveCommunity,
  useCreateCommunity,
  slugify,
} from "@/hooks/useCommunities";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Plus, Lock, Globe, Search, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Communities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: all = [], isLoading } = useCommunities();
  const { data: myMems = [] } = useMyMemberships();
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();
  const create = useCreateCommunity();

  const [tab, setTab] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const memberOf = useMemo(() => new Set(myMems.map((m) => m.community_id)), [myMems]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return all
      .filter((c) => tab === "all" || memberOf.has(c.id))
      .filter(
        (c) =>
          !s ||
          c.name.toLowerCase().includes(s) ||
          c.slug.toLowerCase().includes(s) ||
          (c.description || "").toLowerCase().includes(s)
      );
  }, [all, tab, search, memberOf]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      toast.error("Le nom doit contenir au moins 3 caractères.");
      return;
    }
    const slug = slugify(trimmed);
    if (!slug) {
      toast.error("Nom invalide.");
      return;
    }
    try {
      const c = await create.mutateAsync({
        name: trimmed,
        slug,
        description: desc.trim() || undefined,
        is_private: isPrivate,
      });
      toast.success("Communauté créée !");
      setOpen(false);
      setName("");
      setDesc("");
      setIsPrivate(false);
      navigate(`/communities/${c.slug}`);
    } catch (e: any) {
      toast.error(e?.message?.includes("duplicate") ? "Ce nom est déjà pris." : "Création impossible.");
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold font-mono text-foreground">Communautés</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Rejoignez des espaces thématiques ou créez le vôtre.
            </p>
          </div>
          <button
            onClick={() => (user ? setOpen(true) : navigate("/auth"))}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 self-start"
          >
            <Plus className="h-4 w-4" />
            Créer une communauté
          </button>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
            <button
              onClick={() => setTab("all")}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                tab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                tab === "mine" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              disabled={!user}
            >
              Mes communautés
            </button>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="h-9 w-full rounded-md border border-border bg-muted pl-8 pr-3 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Chargement…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {tab === "mine"
                ? user
                  ? "Vous n'avez encore rejoint aucune communauté."
                  : "Connectez-vous pour voir vos communautés."
                : "Aucune communauté pour le moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => {
              const isMember = memberOf.has(c.id);
              return (
                <div
                  key={c.id}
                  className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-sm font-bold text-primary shrink-0">
                      {c.avatar || c.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/communities/${c.slug}`}
                        className="font-semibold text-foreground hover:text-primary truncate block"
                      >
                        {c.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                        {c.is_private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                        {c.is_private ? "Privée" : "Publique"} · {c.member_count} membre
                        {c.member_count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <Link
                      to={`/communities/${c.slug}`}
                      className="flex-1 text-center rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                    >
                      Voir
                    </Link>
                    {user ? (
                      isMember ? (
                        <button
                          onClick={() => leave.mutate(c.id)}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40"
                        >
                          Quitter
                        </button>
                      ) : c.is_private ? (
                        <span className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
                          Sur invitation
                        </span>
                      ) : (
                        <button
                          onClick={() => join.mutate(c.id)}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Rejoindre
                        </button>
                      )
                    ) : (
                      <Link
                        to="/auth"
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium flex items-center gap-1"
                      >
                        <LogIn className="h-3 w-3" /> Se connecter
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une communauté</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Nom</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : React France"
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                />
                {name && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    URL : /communities/{slugify(name)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  placeholder="À propos de cette communauté…"
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Communauté privée (uniquement sur invitation)
              </label>
            </div>
            <DialogFooter>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={create.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {create.isPending ? "Création…" : "Créer"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Communities;
