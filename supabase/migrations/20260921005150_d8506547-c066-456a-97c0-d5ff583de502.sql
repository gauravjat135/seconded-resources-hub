ALTER TABLE public.listings
  ADD COLUMN seller_name text NOT NULL DEFAULT 'SecondEd Student',
  ADD COLUMN seller_phone text NOT NULL DEFAULT '',
  ADD COLUMN seller_college text NOT NULL DEFAULT 'Other',
  ADD COLUMN seller_location text NOT NULL DEFAULT 'Vasai',
  ADD COLUMN seller_avatar text NOT NULL DEFAULT '',
  ADD COLUMN seller_member_since text NOT NULL DEFAULT '2026';