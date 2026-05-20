ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS renewal_payment numeric NOT NULL DEFAULT 0;