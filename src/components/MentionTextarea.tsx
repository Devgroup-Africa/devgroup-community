import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  id: string;
  username: string;
  avatar: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
}

const MentionTextarea = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  rows = 4,
  maxLength,
}: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (query === null) return;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar")
        .ilike("username", `${query}%`)
        .limit(6);
      setSuggestions(data || []);
      setActiveIdx(0);
    }, 120);
    return () => clearTimeout(t);
  }, [query]);

  const detectMention = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const m = before.match(/(?:^|\s)@([a-zA-Z0-9_-]{0,30})$/);
    return m ? m[1] : null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    onChange(v);
    const caret = e.target.selectionStart ?? v.length;
    const q = detectMention(v, caret);
    setQuery(q);
  };

  const insertMention = (username: string) => {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const replaced = before.replace(/@([a-zA-Z0-9_-]{0,30})$/, `@${username} `);
    const next = replaced + after;
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      const pos = replaced.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (query === null || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(suggestions[activeIdx].username);
    } else if (e.key === "Escape") {
      setQuery(null);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={className}
      />
      {query !== null && suggestions.length > 0 && (
        <div className="absolute left-3 bottom-2 z-20 w-64 max-h-56 overflow-auto rounded-md border border-border bg-popover shadow-lg animate-fade-in">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => insertMention(s.username)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                i === activeIdx
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary text-foreground"
              }`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                {s.avatar}
              </span>
              <span className="font-medium">@{s.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
