import Layout from "@/components/Layout";
import { allTags, questions } from "@/data/mockData";
import { Link } from "react-router-dom";

const Tags = () => {
  const tagCounts = allTags.map((tag) => ({
    name: tag,
    count: questions.filter((q) => q.tags.includes(tag)).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold font-mono text-foreground mb-1">Tags</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Parcourez les sujets par technologie
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tagCounts.map(({ name, count }) => (
            <Link
              key={name}
              to={`/?tag=${name}`}
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors group"
            >
              <span className="font-mono text-sm font-semibold text-primary group-hover:text-primary/80">
                <span className="text-muted-foreground">#</span>{name}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {count} question{count !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Tags;
