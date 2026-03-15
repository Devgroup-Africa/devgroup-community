import { useState } from "react";
import { questions, allTags } from "@/data/mockData";
import QuestionCard from "@/components/QuestionCard";
import Layout from "@/components/Layout";
import { Filter, Flame, Clock, TrendingUp } from "lucide-react";

type SortBy = "votes" | "recent" | "trending";

const Index = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("votes");

  const filtered = questions
    .filter((q) => !activeTag || q.tags.includes(activeTag))
    .sort((a, b) => {
      if (sortBy === "votes") return b.votes - a.votes;
      if (sortBy === "trending") return b.views - a.views;
      return 0; // recent - already in order
    });

  const popularTags = allTags.slice(0, 10);

  return (
    <Layout>
      <div className="flex gap-6">
        {/* Sidebar - Tags */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3 w-3" />
              Tags populaires
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTag(null)}
                className={`rounded-md px-3 py-1.5 text-left text-sm font-medium transition-colors ${
                  !activeTag
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Toutes les questions
              </button>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`rounded-md px-3 py-1.5 text-left text-sm font-mono transition-colors ${
                    activeTag === tag
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="text-muted-foreground mr-1">#</span>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-mono text-foreground">
                {activeTag ? (
                  <>
                    <span className="text-primary">#</span>{activeTag}
                  </>
                ) : (
                  "Questions"
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filtered.length} question{filtered.length > 1 ? "s" : ""}
              </p>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {([
                { key: "votes" as SortBy, icon: Flame, label: "Top" },
                { key: "recent" as SortBy, icon: Clock, label: "Récent" },
                { key: "trending" as SortBy, icon: TrendingUp, label: "Trending" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    sortBy === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Questions list */}
          <div className="flex flex-col gap-2">
            {filtered.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground">Aucune question trouvée pour ce filtre.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
