ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS first_payment numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lease_duration_months integer NOT NULL DEFAULT 12;