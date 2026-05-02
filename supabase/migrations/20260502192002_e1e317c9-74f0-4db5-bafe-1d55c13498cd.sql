-- 1. Enum des rôles
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');

-- 2. Table user_roles (séparée des profiles pour éviter privilege escalation)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Fonction security definer (évite récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: est-il admin OU super_admin ?
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  )
$$;

-- 4. RLS user_roles
CREATE POLICY "Roles viewable by everyone"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Only super_admin can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Only super_admin can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. Table bans (pour bannir des utilisateurs)
CREATE TABLE public.user_bans (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bans viewable by admins"
  ON public.user_bans FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can ban"
  ON public.user_bans FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can unban"
  ON public.user_bans FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 6. Table de signalements (modération)
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('question', 'answer')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports viewable by admins"
  ON public.reports FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()) OR auth.uid() = reporter_id);

CREATE POLICY "Authenticated can report"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can resolve reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 7. Étendre RLS pour permettre aux admins de modérer
CREATE POLICY "Admins can delete any question"
  ON public.questions FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any question"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any answer"
  ON public.answers FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any answer"
  ON public.answers FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Tags : admins peuvent éditer/supprimer
CREATE POLICY "Admins can update tags"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tags"
  ON public.tags FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 8. Promouvoir dev_master en super_admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('fded6e20-bc76-44ee-a9e8-56eaf5a4ca14', 'super_admin');

-- 9. Vue stats pour dashboard (security invoker => RLS s'applique)
CREATE OR REPLACE VIEW public.platform_stats
WITH (security_invoker=on) AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) AS total_users,
  (SELECT COUNT(*) FROM public.questions) AS total_questions,
  (SELECT COUNT(*) FROM public.answers) AS total_answers,
  (SELECT COUNT(*) FROM public.votes) AS total_votes,
  (SELECT COUNT(*) FROM public.tags) AS total_tags,
  (SELECT COUNT(*) FROM public.questions WHERE created_at > now() - interval '7 days') AS questions_last_7d,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days') AS users_last_7d,
  (SELECT COUNT(*) FROM public.questions q WHERE NOT EXISTS (SELECT 1 FROM public.answers a WHERE a.question_id = q.id)) AS unanswered_questions,
  (SELECT COUNT(*) FROM public.reports WHERE status = 'pending') AS pending_reports;