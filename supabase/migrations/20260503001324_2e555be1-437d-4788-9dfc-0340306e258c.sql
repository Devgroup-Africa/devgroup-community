DROP VIEW IF EXISTS public.questions_with_meta;
CREATE VIEW public.questions_with_meta
WITH (security_invoker=on) AS
SELECT
  q.*,
  p.username AS author_username,
  p.avatar AS author_avatar,
  COALESCE((SELECT SUM(value)::int FROM public.votes v WHERE v.target_type='question' AND v.target_id = q.id), 0) AS votes,
  COALESCE((SELECT COUNT(*)::int FROM public.answers a WHERE a.question_id = q.id), 0) AS answers_count,
  COALESCE(ARRAY(SELECT tag_name FROM public.question_tags qt WHERE qt.question_id = q.id ORDER BY tag_name), ARRAY[]::text[]) AS tags
FROM public.questions q
JOIN public.profiles p ON p.id = q.author_id;