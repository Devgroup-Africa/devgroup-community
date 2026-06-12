
-- 1. Add new community roles
ALTER TYPE public.community_role ADD VALUE IF NOT EXISTS 'mentor';
ALTER TYPE public.community_role ADD VALUE IF NOT EXISTS 'cadet';

-- 2. Allow discussion as post_type
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_post_type_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_post_type_check
  CHECK (post_type IN ('question','news','discussion'));

-- 3. Recreate questions_with_meta with community_id
DROP VIEW IF EXISTS public.questions_with_meta CASCADE;
CREATE VIEW public.questions_with_meta
WITH (security_invoker=on) AS
  SELECT q.id, q.author_id, q.title, q.body, q.views, q.bookmarks,
         q.created_at, q.updated_at, q.post_type, q.community_id,
         p.username AS author_username, p.avatar AS author_avatar,
         COALESCE((SELECT SUM(v.value)::int FROM public.votes v
                   WHERE v.target_type='question' AND v.target_id = q.id), 0) AS votes,
         COALESCE((SELECT COUNT(*)::int FROM public.answers a
                   WHERE a.question_id = q.id), 0) AS answers_count,
         COALESCE(ARRAY(SELECT qt.tag_name FROM public.question_tags qt
                        WHERE qt.question_id = q.id ORDER BY qt.tag_name),
                  ARRAY[]::text[]) AS tags
  FROM public.questions q
  JOIN public.profiles p ON p.id = q.author_id;
GRANT SELECT ON public.questions_with_meta TO anon, authenticated;

-- 4. Hide private-community questions from non-members
DROP POLICY IF EXISTS "Questions viewable by everyone" ON public.questions;
CREATE POLICY "Questions visible unless private community"
  ON public.questions FOR SELECT
  USING (
    community_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = questions.community_id AND NOT c.is_private
    )
    OR public.is_community_member(community_id, auth.uid())
    OR public.is_admin(auth.uid())
  );

-- 5. Let joining users pick member/mentor/cadet for public communities
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role::text IN ('member','mentor','cadet')
    AND EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_members.community_id AND NOT c.is_private
    )
  );
