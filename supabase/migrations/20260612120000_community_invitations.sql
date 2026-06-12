-- Shareable community invitation links and referral rewards
CREATE TABLE public.community_invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, inviter_id)
);

CREATE TABLE public.community_invite_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.community_invite_links(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, joined_user_id)
);

CREATE INDEX idx_community_invite_links_inviter ON public.community_invite_links(inviter_id);
CREATE INDEX idx_community_invite_uses_inviter ON public.community_invite_uses(inviter_id);

ALTER TABLE public.community_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invite_uses ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.community_invite_links TO authenticated;
GRANT SELECT ON public.community_invite_uses TO authenticated;
GRANT ALL ON public.community_invite_links, public.community_invite_uses TO service_role;

CREATE POLICY "Members see community invitation links"
  ON public.community_invite_links FOR SELECT TO authenticated
  USING (public.is_community_member(community_id, auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Users see own referral results"
  ON public.community_invite_uses FOR SELECT TO authenticated
  USING (inviter_id = auth.uid() OR joined_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.create_community_invite_link(_community_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result_token uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_community_member(_community_id, auth.uid()) THEN
    RAISE EXCEPTION 'Vous devez etre membre de cette communaute';
  END IF;

  INSERT INTO public.community_invite_links (community_id, inviter_id)
  VALUES (_community_id, auth.uid())
  ON CONFLICT (community_id, inviter_id)
  DO UPDATE SET active = true
  RETURNING token INTO result_token;

  RETURN result_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_community_invite_preview(_token uuid)
RETURNS TABLE (
  community_id uuid,
  community_slug text,
  community_name text,
  community_description text,
  community_avatar text,
  community_is_private boolean,
  community_member_count integer,
  inviter_username text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.slug, c.name, c.description, c.avatar, c.is_private, c.member_count, p.username
  FROM public.community_invite_links l
  JOIN public.communities c ON c.id = l.community_id
  JOIN public.profiles p ON p.id = l.inviter_id
  WHERE l.token = _token
    AND l.active
    AND public.is_community_member(l.community_id, l.inviter_id)
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.accept_community_invite_link(_token uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invite_link public.community_invite_links%ROWTYPE;
  community_slug text;
  inserted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connectez-vous pour rejoindre la communaute';
  END IF;

  SELECT l, c.slug INTO invite_link, community_slug
  FROM public.community_invite_links l
  JOIN public.communities c ON c.id = l.community_id
  WHERE l.token = _token
    AND l.active
    AND public.is_community_member(l.community_id, l.inviter_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lien d invitation invalide';
  END IF;

  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (invite_link.community_id, auth.uid(), 'member')
  ON CONFLICT (community_id, user_id) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count > 0 AND invite_link.inviter_id <> auth.uid() THEN
    INSERT INTO public.community_invite_uses (link_id, community_id, inviter_id, joined_user_id)
    VALUES (invite_link.id, invite_link.community_id, invite_link.inviter_id, auth.uid())
    ON CONFLICT (community_id, joined_user_id) DO NOTHING;

    PERFORM public.recompute_reputation(invite_link.inviter_id);
    PERFORM public.award_badges(invite_link.inviter_id);
    PERFORM public.award_badges(auth.uid());
  END IF;

  RETURN community_slug;
END;
$$;

REVOKE ALL ON FUNCTION public.create_community_invite_link(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_community_invite_link(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_community_invite_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_community_invite_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_invite_preview(uuid) TO anon, authenticated;

-- Add referral points to the durable reputation calculation.
CREATE OR REPLACE FUNCTION public.recompute_reputation(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rep int := 0;
  v_q_votes int; v_a_votes int; v_accepted int; v_q_count int; v_a_count int; v_referrals int;
BEGIN
  SELECT COALESCE(SUM(v.value),0) INTO v_q_votes
    FROM votes v JOIN questions q ON q.id = v.target_id
    WHERE v.target_type = 'question' AND q.author_id = _user_id;
  SELECT COALESCE(SUM(v.value),0) INTO v_a_votes
    FROM votes v JOIN answers a ON a.id = v.target_id
    WHERE v.target_type = 'answer' AND a.author_id = _user_id;
  SELECT COUNT(*) INTO v_accepted FROM answers WHERE author_id = _user_id AND accepted = true;
  SELECT COUNT(*) INTO v_q_count FROM questions WHERE author_id = _user_id;
  SELECT COUNT(*) INTO v_a_count FROM answers WHERE author_id = _user_id;
  SELECT COUNT(*) INTO v_referrals FROM community_invite_uses WHERE inviter_id = _user_id;

  rep := GREATEST(0, v_q_votes * 5 + v_a_votes * 10 + v_accepted * 15 + v_q_count + v_a_count * 2 + v_referrals * 10);
  UPDATE profiles SET reputation = rep WHERE id = _user_id;
END;
$$;

-- Expanded badge catalog
INSERT INTO public.badges (code, name, description, icon, tier) VALUES
  ('questions_5', 'Curieux régulier', 'Vous avez publié 5 questions.', 'circle-help', 'bronze'),
  ('questions_25', 'Grand curieux', 'Vous avez publié 25 questions.', 'circle-help', 'silver'),
  ('questions_100', 'Esprit insatiable', 'Vous avez publié 100 questions.', 'circle-help', 'gold'),
  ('answers_10', 'Main forte', 'Vous avez publié 10 réponses.', 'messages-square', 'bronze'),
  ('answers_50', 'Guide reconnu', 'Vous avez publié 50 réponses.', 'messages-square', 'silver'),
  ('answers_200', 'Encyclopédie vivante', 'Vous avez publié 200 réponses.', 'messages-square', 'gold'),
  ('accepted_x50', 'Référence', '50 de vos réponses ont été acceptées.', 'badge-check', 'gold'),
  ('votes_500', 'Plébiscité', 'Vous avez cumulé 500 votes positifs.', 'heart', 'gold'),
  ('first_comment', 'Premier échange', 'Vous avez publié votre premier commentaire.', 'message-circle', 'bronze'),
  ('comments_25', 'Conversation active', 'Vous avez publié 25 commentaires.', 'message-circle', 'silver'),
  ('followers_10', 'Suivi', '10 membres vous suivent.', 'users', 'silver'),
  ('followers_100', 'Influenceur', '100 membres vous suivent.', 'users', 'gold'),
  ('community_first', 'En groupe', 'Vous avez rejoint votre première communauté.', 'users-round', 'bronze'),
  ('communities_5', 'Explorateur de groupes', 'Vous avez rejoint 5 communautés.', 'users-round', 'silver'),
  ('communities_15', 'Citoyen de la plateforme', 'Vous avez rejoint 15 communautés.', 'users-round', 'gold'),
  ('referral_1', 'Premier parrainage', 'Une personne a rejoint une communauté grâce à votre lien.', 'user-plus', 'bronze'),
  ('referrals_5', 'Ambassadeur', '5 personnes ont rejoint une communauté grâce à vos liens.', 'user-plus', 'silver'),
  ('referrals_25', 'Bâtisseur de communauté', '25 personnes ont rejoint une communauté grâce à vos liens.', 'user-plus', 'gold'),
  ('reputation_100', 'Remarqué', 'Vous avez atteint 100 points de réputation.', 'sparkles', 'bronze'),
  ('reputation_500', 'Respecté', 'Vous avez atteint 500 points de réputation.', 'sparkles', 'silver'),
  ('reputation_2000', 'Pilier', 'Vous avez atteint 2 000 points de réputation.', 'crown', 'gold')
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.award_badges(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q_count int; a_count int; accepted_count int; up_votes int; comment_count int;
  follower_count int; community_count int; referral_count int; rep int;
  member_since timestamptz;
BEGIN
  SELECT COUNT(*) INTO q_count FROM questions WHERE author_id = _user_id;
  SELECT COUNT(*) INTO a_count FROM answers WHERE author_id = _user_id;
  SELECT COUNT(*) INTO accepted_count FROM answers WHERE author_id = _user_id AND accepted = true;
  SELECT COALESCE(SUM(v.value),0) INTO up_votes FROM votes v
    LEFT JOIN questions q ON q.id = v.target_id AND v.target_type='question'
    LEFT JOIN answers a ON a.id = v.target_id AND v.target_type='answer'
    WHERE (q.author_id = _user_id OR a.author_id = _user_id) AND v.value > 0;
  SELECT COUNT(*) INTO comment_count FROM comments WHERE author_id = _user_id;
  SELECT COUNT(*) INTO follower_count FROM follows WHERE following_id = _user_id;
  SELECT COUNT(*) INTO community_count FROM community_members WHERE user_id = _user_id;
  SELECT COUNT(*) INTO referral_count FROM community_invite_uses WHERE inviter_id = _user_id;
  SELECT created_at, reputation INTO member_since, rep FROM profiles WHERE id = _user_id;

  IF q_count >= 1 THEN INSERT INTO user_badges VALUES (_user_id, 'first_question', now()) ON CONFLICT DO NOTHING; END IF;
  IF q_count >= 5 THEN INSERT INTO user_badges VALUES (_user_id, 'questions_5', now()) ON CONFLICT DO NOTHING; END IF;
  IF q_count >= 25 THEN INSERT INTO user_badges VALUES (_user_id, 'questions_25', now()) ON CONFLICT DO NOTHING; END IF;
  IF q_count >= 100 THEN INSERT INTO user_badges VALUES (_user_id, 'questions_100', now()) ON CONFLICT DO NOTHING; END IF;
  IF a_count >= 1 THEN INSERT INTO user_badges VALUES (_user_id, 'first_answer', now()) ON CONFLICT DO NOTHING; END IF;
  IF a_count >= 10 THEN INSERT INTO user_badges VALUES (_user_id, 'answers_10', now()) ON CONFLICT DO NOTHING; END IF;
  IF a_count >= 50 THEN INSERT INTO user_badges VALUES (_user_id, 'answers_50', now()) ON CONFLICT DO NOTHING; END IF;
  IF a_count >= 200 THEN INSERT INTO user_badges VALUES (_user_id, 'answers_200', now()) ON CONFLICT DO NOTHING; END IF;
  IF accepted_count >= 1 THEN INSERT INTO user_badges VALUES (_user_id, 'accepted_x1', now()) ON CONFLICT DO NOTHING; END IF;
  IF accepted_count >= 10 THEN INSERT INTO user_badges VALUES (_user_id, 'accepted_x10', now()) ON CONFLICT DO NOTHING; END IF;
  IF accepted_count >= 50 THEN INSERT INTO user_badges VALUES (_user_id, 'accepted_x50', now()) ON CONFLICT DO NOTHING; END IF;
  IF up_votes >= 10 THEN INSERT INTO user_badges VALUES (_user_id, 'votes_10', now()) ON CONFLICT DO NOTHING; END IF;
  IF up_votes >= 100 THEN INSERT INTO user_badges VALUES (_user_id, 'votes_100', now()) ON CONFLICT DO NOTHING; END IF;
  IF up_votes >= 500 THEN INSERT INTO user_badges VALUES (_user_id, 'votes_500', now()) ON CONFLICT DO NOTHING; END IF;
  IF q_count >= 5 AND a_count >= 10 THEN INSERT INTO user_badges VALUES (_user_id, 'contributor', now()) ON CONFLICT DO NOTHING; END IF;
  IF comment_count >= 1 THEN INSERT INTO user_badges VALUES (_user_id, 'first_comment', now()) ON CONFLICT DO NOTHING; END IF;
  IF comment_count >= 25 THEN INSERT INTO user_badges VALUES (_user_id, 'comments_25', now()) ON CONFLICT DO NOTHING; END IF;
  IF follower_count >= 10 THEN INSERT INTO user_badges VALUES (_user_id, 'followers_10', now()) ON CONFLICT DO NOTHING; END IF;
  IF follower_count >= 100 THEN INSERT INTO user_badges VALUES (_user_id, 'followers_100', now()) ON CONFLICT DO NOTHING; END IF;
  IF community_count >= 1 THEN INSERT INTO user_badges VALUES (_user_id, 'community_first', now()) ON CONFLICT DO NOTHING; END IF;
  IF community_count >= 5 THEN INSERT INTO user_badges VALUES (_user_id, 'communities_5', now()) ON CONFLICT DO NOTHING; END IF;
  IF community_count >= 15 THEN INSERT INTO user_badges VALUES (_user_id, 'communities_15', now()) ON CONFLICT DO NOTHING; END IF;
  IF referral_count >= 1 THEN INSERT INTO user_badges VALUES (_user_id, 'referral_1', now()) ON CONFLICT DO NOTHING; END IF;
  IF referral_count >= 5 THEN INSERT INTO user_badges VALUES (_user_id, 'referrals_5', now()) ON CONFLICT DO NOTHING; END IF;
  IF referral_count >= 25 THEN INSERT INTO user_badges VALUES (_user_id, 'referrals_25', now()) ON CONFLICT DO NOTHING; END IF;
  IF rep >= 100 THEN INSERT INTO user_badges VALUES (_user_id, 'reputation_100', now()) ON CONFLICT DO NOTHING; END IF;
  IF rep >= 500 THEN INSERT INTO user_badges VALUES (_user_id, 'reputation_500', now()) ON CONFLICT DO NOTHING; END IF;
  IF rep >= 2000 THEN INSERT INTO user_badges VALUES (_user_id, 'reputation_2000', now()) ON CONFLICT DO NOTHING; END IF;
  IF member_since < now() - interval '365 days' THEN INSERT INTO user_badges VALUES (_user_id, 'veteran', now()) ON CONFLICT DO NOTHING; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_award_activity_badges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_user uuid;
BEGIN
  target_user := CASE
    WHEN TG_TABLE_NAME = 'follows' THEN COALESCE(NEW.following_id, OLD.following_id)
    WHEN TG_TABLE_NAME = 'community_members' THEN COALESCE(NEW.user_id, OLD.user_id)
    ELSE COALESCE(NEW.author_id, OLD.author_id)
  END;
  PERFORM public.award_badges(target_user);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER comments_award_badges AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_activity_badges();
CREATE TRIGGER follows_award_badges AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_activity_badges();
CREATE TRIGGER community_members_award_badges AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_activity_badges();
