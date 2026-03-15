import { Link } from "react-router-dom";
import { ChevronUp, MessageSquare, Eye } from "lucide-react";
import type { Question } from "@/data/mockData";

const QuestionCard = ({ question }: { question: Question }) => {
  const hasAccepted = question.answers.some((a) => a.accepted);

  return (
    <Link
      to={`/question/${question.id}`}
      className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-card/80 animate-fade-in"
    >
      <div className="flex gap-4">
        {/* Stats */}
        <div className="flex flex-col items-center gap-2 shrink-0 text-center min-w-[60px]">
          <div className="flex flex-col items-center">
            <ChevronUp className="h-4 w-4 text-vote-up" />
            <span className="text-lg font-bold font-mono text-foreground">{question.votes}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">votes</span>
          </div>
          <div
            className={`flex flex-col items-center rounded-md px-2 py-1 ${
              hasAccepted
                ? "bg-primary/15 text-primary"
                : question.answers.length > 0
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-sm font-bold font-mono">{question.answers.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {question.title}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
            {question.body.replace(/```[\s\S]*?```/g, "[code]").replace(/`[^`]+`/g, "[code]").slice(0, 150)}...
          </p>

          {/* Tags + Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm bg-tag px-2 py-0.5 text-xs font-mono font-medium text-tag-foreground"
              >
                {tag}
              </span>
            ))}
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {question.views}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                  {question.authorAvatar}
                </span>
                {question.author}
              </span>
              <span>{question.createdAt}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default QuestionCard;
