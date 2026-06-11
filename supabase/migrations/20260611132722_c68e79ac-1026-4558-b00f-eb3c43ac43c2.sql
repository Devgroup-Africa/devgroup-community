
-- Communities feature
CREATE TYPE public.community_role AS ENUM ('member','moderator','admin');

CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  avatar text,
  banner_url text,
  is_private boolean NOT NULL DEFAULT false,
  owner_id uuid NOT NULL,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.communities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.community_members (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.community_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

GRANT SELECT ON public.community_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Add community link on questions (posts)
ALTER TABLE public.questions ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;
CREATE INDEX idx_questions_community ON public.questions(community_id);

-- Helper functions (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_community_member(_community_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_members WHERE community_id = _community_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.community_role_of(_community_id uuid, _user_id uuid)
RETURNS public.community_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.community_members WHERE community_id = _community_id AND user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_community_staff(_community_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community_id AND user_id = _user_id AND role IN ('moderator','admin')
  )
$$;

-- Maintain member_count + auto-add owner as admin
CREATE OR REPLACE FUNCTION public.trg_community_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_cm_count
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION public.trg_community_member_count();

CREATE OR REPLACE FUNCTION public.trg_community_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_community_owner_admin
AFTER INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.trg_community_owner_admin();

CREATE TRIGGER trg_communities_updated
BEFORE UPDATE ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS policies: communities
CREATE POLICY "Public communities are visible to all"
  ON public.communities FOR SELECT
  USING (NOT is_private OR public.is_community_member(id, auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users create communities"
  ON public.communities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and community admins update community"
  ON public.communities FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.community_role_of(id, auth.uid()) = 'admin' OR public.is_admin(auth.uid()))
  WITH CHECK (true);

CREATE POLICY "Owners and platform admins delete community"
  ON public.communities FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

-- RLS policies: community_members
CREATE POLICY "Members visible if community visible"
  ON public.community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id
        AND (NOT c.is_private OR public.is_community_member(c.id, auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'member'
    AND EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND NOT c.is_private)
  );

CREATE POLICY "Staff manage memberships"
  ON public.community_members FOR INSERT TO authenticated
  WITH CHECK (public.is_community_staff(community_id, auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Staff update roles"
  ON public.community_members FOR UPDATE TO authenticated
  USING (public.is_community_staff(community_id, auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (true);

CREATE POLICY "Users leave or staff removes"
  ON public.community_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_community_staff(community_id, auth.uid())
    OR public.is_admin(auth.uid())
  );
