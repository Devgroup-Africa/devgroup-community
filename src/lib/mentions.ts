import { Link } from "react-router-dom";
import React from "react";
import { supabase } from "@/integrations/supabase/client";

export const MENTION_REGEX = /(^|\s)@([a-zA-Z0-9_-]{2,30})/g;

/** Extract unique usernames from a body */
export function extractMentions(text: string): string[] {
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_REGEX);
  while ((m = re.exec(text)) !== null) set.add(m[2]);
  return [...set];
}

/** Render text with @username turned into links to user profiles. usernameToId map resolves links. */
export function renderWithMentions(
  text: string,
  usernameToId: Record<string, string> = {}
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  const re = /(^|[\s(])@([a-zA-Z0-9_-]{2,30})/g;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[1].length;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    const username = m[2];
    const id = usernameToId[username.toLowerCase()];
    if (id) {
      nodes.push(
        React.createElement(
          Link,
          {
            key: `m-${key++}`,
            to: `/user/${id}`,
            className:
              "text-primary font-medium hover:underline",
          },
          `@${username}`
        )
      );
    } else {
      nodes.push(`@${username}`);
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Resolve a list of usernames to their profile ids */
export async function resolveMentions(usernames: string[]) {
  if (usernames.length === 0) return [] as { id: string; username: string }[];
  const { data } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", usernames);
  return data || [];
}
