ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE OR REPLACE FUNCTION public.current_email()
RETURNS text LANGUAGE sql STABLE SET search_path = public
AS $$ SELECT lower(coalesce(auth.jwt() ->> 'email', '')) $$;

CREATE TABLE public.listings (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  original_price integer NOT NULL DEFAULT 0,
  category text NOT NULL,
  condition text NOT NULL,
  location text NOT NULL,
  college text NOT NULL,
  image text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Available',
  owner_id uuid,
  owner_email text NOT NULL,
  posted text NOT NULL DEFAULT 'Just now',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings are publicly viewable" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Students can create their own listings" ON public.listings FOR INSERT TO authenticated
  WITH CHECK (lower(owner_email) = public.current_email() AND (owner_id IS NULL OR owner_id = auth.uid()));
CREATE POLICY "Students can update their own listings" ON public.listings FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR lower(owner_email) = public.current_email())
  WITH CHECK (owner_id = auth.uid() OR lower(owner_email) = public.current_email());
CREATE POLICY "Students can delete their own listings" ON public.listings FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR lower(owner_email) = public.current_email());
CREATE TRIGGER set_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL,
  resource_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_email, resource_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own favorites" ON public.favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(user_email) = public.current_email());
CREATE POLICY "Students can add their own favorites" ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (lower(user_email) = public.current_email());
CREATE POLICY "Students can remove their own favorites" ON public.favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR lower(user_email) = public.current_email());

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid,
  buyer_email text NOT NULL,
  buyer_name text NOT NULL,
  buyer_avatar text,
  seller_id uuid,
  seller_email text NOT NULL,
  seller_name text NOT NULL,
  seller_avatar text,
  resource_id text NOT NULL,
  resource_title text NOT NULL,
  unread_for text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view their conversations" ON public.conversations FOR SELECT TO authenticated
  USING (lower(buyer_email) = public.current_email() OR lower(seller_email) = public.current_email());
CREATE POLICY "Buyers can start conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (lower(buyer_email) = public.current_email());
CREATE POLICY "Participants can update their conversations" ON public.conversations FOR UPDATE TO authenticated
  USING (lower(buyer_email) = public.current_email() OR lower(seller_email) = public.current_email())
  WITH CHECK (lower(buyer_email) = public.current_email() OR lower(seller_email) = public.current_email());
CREATE TRIGGER set_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_role text NOT NULL,
  sender_email text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id
      AND (lower(c.buyer_email) = public.current_email() OR lower(c.seller_email) = public.current_email())
  )
$$;
CREATE POLICY "Participants can read conversation messages" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id));
CREATE POLICY "Participants can send conversation messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (public.is_conversation_participant(conversation_id) AND lower(sender_email) = public.current_email());

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id text NOT NULL,
  resource_title text NOT NULL,
  reporter_id uuid,
  reporter_email text NOT NULL,
  reason text NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_email, resource_id)
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in students can review reports" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can submit their own reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (lower(reporter_email) = public.current_email());
CREATE POLICY "Signed-in students can update report status" ON public.reports FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);