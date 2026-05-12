
-- Polls
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL UNIQUE,
  author_id uuid NOT NULL,
  title text NOT NULL,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.poll_votes (
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, user_id)
);

CREATE INDEX idx_poll_options_poll ON public.poll_options(poll_id);
CREATE INDEX idx_poll_votes_option ON public.poll_votes(option_id);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Polls viewable by everyone" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Question author can create poll" ON public.polls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.author_id = auth.uid()
  ));
CREATE POLICY "Author can delete own poll" ON public.polls FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can delete any poll" ON public.polls FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Poll options policies
CREATE POLICY "Poll options viewable by everyone" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Poll author can add options" ON public.poll_options FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.author_id = auth.uid()));
CREATE POLICY "Poll author can delete options" ON public.poll_options FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.author_id = auth.uid()));

-- Poll votes policies
CREATE POLICY "Poll votes viewable by everyone" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can vote" ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.polls p WHERE p.id = poll_id AND (p.ends_at IS NULL OR p.ends_at > now())
  ));
CREATE POLICY "Users can change own poll vote" ON public.poll_votes FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can remove own poll vote" ON public.poll_votes FOR DELETE
  USING (auth.uid() = user_id);
