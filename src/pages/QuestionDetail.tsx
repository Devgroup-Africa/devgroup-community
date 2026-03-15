import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { questions } from "@/data/mockData";
import Layout from "@/components/Layout";
import VoteButton from "@/components/VoteButton";
import CopyButton from "@/components/CopyButton";
import { CheckCircle2, ArrowLeft, Eye, Bookmark, Share2, MessageSquare, Clock } from "lucide-react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

const QuestionDetail = () => {
  const { id } = useParams();
  const question = questions.find((q) => q.id === id);
  const contentRef = useRef<HTMLDivElement>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [answerSort, setAnswerSort] = useState<"votes" | "recent">("votes");

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  });

  if (!question) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Question introuvable.</p>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">
            ← Retour aux questions
          </Link>
        </div>
      </Layout>
    );
  }

  const sortedAnswers = [...question.answers].sort((a, b) => {
    if (answerSort === "votes") {
      // Accepted first, then by votes
      if (a.accepted && !b.accepted) return -1;
      if (!a.accepted && b.accepted) return 1;
      return b.votes - a.votes;
    }
    return 0;
  });

  // Related questions (same tags)
  const related = questions
    .filter((q) => q.id !== question.id && q.tags.some((t) => question.tags.includes(t)))
    .slice(0, 4);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto" ref={contentRef}>
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {/* Back */}
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>

            {/* Question */}
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6 animate-fade-in">
              <div className="flex gap-4 sm:gap-5">
                <div className="hidden sm:block">
                  <VoteButton initialVotes={question.votes} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold font-mono text-foreground leading-tight">
                    {question.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                    <Link
                      to={`/user/${question.authorId}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                        {question.authorAvatar}
                      </span>
                      {question.author}
                    </Link>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {question.createdAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {question.views} vues
                    </span>
                  </div>

                  {/* Mobile vote */}
                  <div className="sm:hidden mt-3">
                    <VoteButton initialVotes={question.votes} />
                  </div>

                  <div className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {renderBody(question.body)}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {question.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/?tag=${tag}`}
                        className="rounded-sm bg-tag px-2 py-0.5 text-xs font-mono font-medium text-tag-foreground hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-3 pt-3 border-t border-border">
                    <button
                      onClick={() => setBookmarked(!bookmarked)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        bookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
                      {bookmarked ? "Enregistrée" : "Enregistrer"} ({question.bookmarks + (bookmarked ? 1 : 0)})
                    </button>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Share2 className="h-3.5 w-3.5" />
                      Partager
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Answers */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-mono text-foreground">
                  {question.answers.length} réponse{question.answers.length !== 1 ? "s" : ""}
                </h2>
                {question.answers.length > 1 && (
                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    <button
                      onClick={() => setAnswerSort("votes")}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        answerSort === "votes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Votes
                    </button>
                    <button
                      onClick={() => setAnswerSort("recent")}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        answerSort === "recent" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Récent
                    </button>
                  </div>
                )}
              </div>

              {question.answers.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Pas encore de réponse. Soyez le premier à répondre !
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {sortedAnswers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`rounded-lg border bg-card p-4 sm:p-5 animate-fade-in ${
                      answer.accepted ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                    }`}
                  >
                    <div className="flex gap-4 sm:gap-5">
                      <div className="hidden sm:flex flex-col items-center gap-2">
                        <VoteButton initialVotes={answer.votes} />
                        {answer.accepted && (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Mobile vote + accepted */}
                        <div className="flex sm:hidden items-center gap-3 mb-3">
                          <VoteButton initialVotes={answer.votes} />
                          {answer.accepted && (
                            <span className="flex items-center gap-1 text-xs text-primary font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              Acceptée
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {renderBody(answer.body)}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
                          <Link
                            to={`/user/${answer.authorId}`}
                            className="flex items-center gap-1.5 hover:text-primary transition-colors"
                          >
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                              {answer.authorAvatar}
                            </span>
                            <span className="font-medium text-foreground">{answer.author}</span>
                          </Link>
                          <span>· {answer.createdAt}</span>
                          {answer.accepted && (
                            <span className="hidden sm:inline ml-auto rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                              Acceptée
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Answer form */}
            <div className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-6 animate-fade-in">
              <h3 className="text-base font-bold font-mono text-foreground mb-3">
                Votre réponse
              </h3>
              <textarea
                placeholder="Écrivez votre réponse... (Markdown supporté)"
                className="w-full h-32 rounded-md border border-border bg-muted p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y transition-colors font-mono"
              />
              <button className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Publier la réponse
              </button>
            </div>
          </div>

          {/* Related Questions Sidebar */}
          {related.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-20 rounded-lg border border-border bg-card overflow-hidden">
                <div className="bg-secondary px-4 py-2.5 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-secondary-foreground">
                    Questions liées
                  </h3>
                </div>
                <div className="p-2">
                  {related.map((q) => (
                    <Link
                      key={q.id}
                      to={`/question/${q.id}`}
                      className="block rounded-md px-3 py-2 text-xs text-foreground/80 hover:text-primary hover:bg-secondary/50 transition-colors leading-snug"
                    >
                      <span className="font-mono text-primary mr-1.5">{q.votes}</span>
                      {q.title.length > 55 ? q.title.slice(0, 55) + "…" : q.title}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
};

function renderBody(text: string) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const langMatch = part.match(/```(\w+)/);
      const lang = langMatch ? langMatch[1] : "";
      const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
      return (
        <div key={i} className="relative group my-3">
          {lang && (
            <span className="absolute top-0 left-0 rounded-tl-md rounded-br-md bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {lang}
            </span>
          )}
          <CopyButton text={code.trim()} />
          <pre className="overflow-x-auto rounded-md bg-code p-3 pt-6 text-xs font-mono border border-border">
            <code className="!bg-transparent !p-0">{code.trim()}</code>
          </pre>
        </div>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-code px-1.5 py-0.5 text-xs font-mono text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Bold
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return <strong key={`${i}-${j}`} className="font-semibold text-foreground">{bp.slice(2, -2)}</strong>;
      }
      return <span key={`${i}-${j}`}>{bp}</span>;
    });
  });
}

export default QuestionDetail;
