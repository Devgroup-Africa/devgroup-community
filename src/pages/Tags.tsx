import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Search, Loader2 } from "lucide-react";
import { useTags, useQuestions } from "@/hooks/useData";

const Tags = () => {
  const [search, setSearch] = useState("");
  const { data: tags = [], isLoading } = useTags();
  const { data: questions = [] } = useQuestions();

  const tagCounts = useMemo(() => {
    return tags
      .map((tag) => ({
        name: tag.name,
        description: tag.description || "",
        count: questions.filter((q) => q.tags.includes(tag.name)).length,
      }))
      .filter((t) => t.name.includes(search.toLowerCase()))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [tags, questions, search]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-mono text-foreground">Tags</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tags.length} tags — parcourez les sujets par technologie
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrer les tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 rounded-md border border-border bg-muted pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {tagCounts.map(({ name, count, description }) => (
              <Link
                key={name}
                to={`/?tag=${name}`}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-all group animate-fade-in"
              >
                <span className="inline-block rounded-sm bg-tag px-2 py-0.5 text-xs font-mono font-semibold text-tag-foreground group-hover:bg-primary/20 transition-colors">
                  {name}
                </span>
                {description && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground font-mono">
                  {count} question{count !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && tagCounts.length === 0 && (
          <div className="mt-12 text-center py-12 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">Aucun tag trouvé pour "{search}".</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tags;
