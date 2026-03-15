import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { allTags } from "@/data/mockData";
import { X } from "lucide-react";

const AskQuestion = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  const filteredTags = allTags.filter(
    (t) => t.includes(tagSearch.toLowerCase()) && !selectedTags.includes(t)
  );

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
      setTagSearch("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock - just navigate back
    navigate("/");
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold font-mono text-foreground mb-1">
          Poser une question
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Décrivez votre problème clairement pour obtenir les meilleures réponses.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Comment optimiser les re-renders dans React ?"
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Décrivez votre problème en détail. Utilisez du Markdown et des blocs de code..."
              className="w-full h-48 rounded-md border border-border bg-muted p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y transition-colors font-mono"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Tags <span className="text-muted-foreground font-normal">(max 5)</span>
            </label>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1 rounded-sm bg-primary/15 px-2 py-0.5 text-xs font-mono font-medium text-primary hover:bg-primary/25 transition-colors"
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Rechercher un tag..."
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />

            {tagSearch && filteredTags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {filteredTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="rounded-sm bg-tag px-2 py-0.5 text-xs font-mono font-medium text-tag-foreground hover:bg-primary/20 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors animate-pulse-glow"
            >
              Publier la question
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AskQuestion;
