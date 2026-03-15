import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { users, questions } from "@/data/mockData";
import { formatReputation } from "@/components/RightSidebar";
import { ArrowLeft, MapPin, Calendar, Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const UserProfile = () => {
  const { id } = useParams();
  const user = users.find((u) => u.id === id);
  const [tab, setTab] = useState<"questions" | "answers">("questions");

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Utilisateur introuvable.</p>
          <Link to="/users" className="text-primary hover:underline mt-2 inline-block">
            ← Retour aux utilisateurs
          </Link>
        </div>
      </Layout>
    );
  }

  const userQuestions = questions.filter((q) => q.authorId === user.id);
  const userAnswers = questions.flatMap((q) =>
    q.answers
      .filter((a) => a.authorId === user.id)
      .map((a) => ({ ...a, questionTitle: q.title, questionId: q.id }))
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Link
          to="/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Utilisateurs
        </Link>

        {/* Profile Header */}
        <div className="rounded-lg border border-border bg-card p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-secondary-foreground shrink-0">
              {user.avatar}
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold font-mono text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Membre depuis {user.joinedAt}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Vu {user.lastSeen}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col items-center gap-4 sm:gap-2 sm:text-right shrink-0">
              <div>
                <p className="text-2xl font-bold font-mono text-primary">{formatReputation(user.reputation)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Réputation</p>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {user.badges.gold > 0 && (
                  <span className="flex items-center gap-1 text-xs">
                    <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
                    {user.badges.gold}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs">
                  <span className="inline-block h-3 w-3 rounded-full bg-gray-400" />
                  {user.badges.silver}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <span className="inline-block h-3 w-3 rounded-full bg-amber-700" />
                  {user.badges.bronze}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="mt-6">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1 mb-4 w-fit">
            <button
              onClick={() => setTab("questions")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "questions"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Questions ({userQuestions.length})
            </button>
            <button
              onClick={() => setTab("answers")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "answers"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Réponses ({userAnswers.length})
            </button>
          </div>

          {tab === "questions" && (
            <div className="space-y-2">
              {userQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune question posée.</p>
              ) : (
                userQuestions.map((q) => (
                  <Link
                    key={q.id}
                    to={`/question/${q.id}`}
                    className="block rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-primary min-w-[2rem] text-right">{q.votes}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {q.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-sm bg-tag px-1.5 py-0.5 text-[10px] font-mono text-tag-foreground">{tag}</span>
                          ))}
                          <span className="text-[10px] text-muted-foreground">{q.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "answers" && (
            <div className="space-y-2">
              {userAnswers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune réponse publiée.</p>
              ) : (
                userAnswers.map((a) => (
                  <Link
                    key={a.id}
                    to={`/question/${a.questionId}`}
                    className="block rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-bold min-w-[2rem] text-right ${a.accepted ? "text-primary" : "text-foreground"}`}>
                        {a.votes}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {a.accepted && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                          <p className="text-sm font-medium text-foreground truncate">{a.questionTitle}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{a.createdAt}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
