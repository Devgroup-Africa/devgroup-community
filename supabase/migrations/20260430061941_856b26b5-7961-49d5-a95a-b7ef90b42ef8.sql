
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT NOT NULL DEFAULT '??',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  reputation INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tags table
CREATE TABLE public.tags (
  name TEXT PRIMARY KEY,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags viewable by everyone" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by everyone" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Authenticated can create questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own questions" ON public.questions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own questions" ON public.questions FOR DELETE USING (auth.uid() = author_id);

-- Question tags join
CREATE TABLE public.question_tags (
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL REFERENCES public.tags(name) ON DELETE CASCADE,
  PRIMARY KEY (question_id, tag_name)
);
ALTER TABLE public.question_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Question tags viewable by everyone" ON public.question_tags FOR SELECT USING (true);
CREATE POLICY "Question authors can tag" ON public.question_tags FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.author_id = auth.uid())
);
CREATE POLICY "Question authors can untag" ON public.question_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.author_id = auth.uid())
);

-- Answers table
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers viewable by everyone" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Authenticated can create answers" ON public.answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own answers" ON public.answers FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Question author can accept any answer" ON public.answers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.author_id = auth.uid())
);
CREATE POLICY "Authors can delete own answers" ON public.answers FOR DELETE USING (auth.uid() = author_id);

-- Votes table (polymorphic via target type)
CREATE TYPE public.vote_target AS ENUM ('question', 'answer');
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.vote_target NOT NULL,
  target_id UUID NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can vote" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER answers_updated BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
BEGIN
  new_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  -- Ensure unique username
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) THEN
    new_username := new_username || '_' || substr(NEW.id::text, 1, 4);
  END IF;
  new_avatar := upper(substr(new_username, 1, 2));
  INSERT INTO public.profiles (id, username, avatar)
  VALUES (NEW.id, new_username, new_avatar);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- View: question with vote counts and tags
CREATE OR REPLACE VIEW public.questions_with_meta
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

CREATE OR REPLACE VIEW public.answers_with_meta
WITH (security_invoker=on) AS
SELECT
  a.*,
  p.username AS author_username,
  p.avatar AS author_avatar,
  COALESCE((SELECT SUM(value)::int FROM public.votes v WHERE v.target_type='answer' AND v.target_id = a.id), 0) AS votes
FROM public.answers a
JOIN public.profiles p ON p.id = a.author_id;
