import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { formatReputation } from "@/components/RightSidebar";
import { Search, TrendingUp, Award, Loader2 } from "lucide-react";
import { useProfiles } from "@/hooks/useData";

type SortBy = "reputation" | "name";

const Users = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("reputation");
  const { data: profiles = [], isLoading } = useProfiles();

  const filtered = useMemo(() => {
    return profiles
      .filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.location || "").toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "reputation") return b.reputation - a.reputation;
        return a.username.localeCompare(b.username);
      });
  }, [profiles, search, sortBy]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-mono text-foreground">Utilisateurs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{profiles.length} membre{profiles.length > 1 ? "s" : ""} de la communauté</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 rounded-md border border-border bg-muted pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {([
                { key: "reputation" as SortBy, icon: Award, label: "Réputation" },
                { key: "name" as SortBy, icon: TrendingUp, label: "Nom" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    sortBy === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">Aucun utilisateur pour l'instant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((user) => (
              <Link
                key={user.id}
                to={`/user/${user.id}`}
                className="group rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-all animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    {user.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {user.username}
                    </p>
                    {user.location && <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.location}</p>}
                    <p className="text-lg font-bold font-mono text-primary mt-1">{formatReputation(user.reputation)}</p>
                    {user.bio && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;
