
-- =========================================================================
-- ENUMS
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'landlord', 'tenant');
CREATE TYPE public.room_status AS ENUM ('vacant', 'reserved', 'occupied', 'maintenance');
CREATE TYPE public.lease_status AS ENUM ('pending', 'active', 'expiring', 'expired', 'terminated');
CREATE TYPE public.booking_status AS ENUM ('pending', 'approved', 'declined', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- =========================================================================
-- HELPERS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================================
-- PROFILES
-- =========================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  id_doc_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- USER ROLES (separate table - critical security pattern)
-- =========================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
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

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );

  -- Assign role from signup metadata; default tenant if absent
  IF NEW.raw_user_meta_data->>'role' = 'landlord' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'landlord');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tenant');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- PROPERTIES
-- =========================================================================
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_properties_landlord ON public.properties(landlord_id);

-- =========================================================================
-- ROOM LABELS (per landlord, color-coded)
-- =========================================================================
CREATE TABLE public.room_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#0d7a5f',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (landlord_id, name)
);

ALTER TABLE public.room_labels ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- ROOMS
-- =========================================================================
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label_id UUID REFERENCES public.room_labels(id) ON DELETE SET NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 1,
  status public.room_status NOT NULL DEFAULT 'vacant',
  amenities TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  is_listed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_rooms_property ON public.rooms(property_id);
CREATE INDEX idx_rooms_status ON public.rooms(status);

-- Helper: room -> landlord lookup for RLS
CREATE OR REPLACE FUNCTION public.room_landlord(_room_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.landlord_id
  FROM public.rooms r
  JOIN public.properties p ON p.id = r.property_id
  WHERE r.id = _room_id
$$;

-- =========================================================================
-- INVITATIONS (landlord invites tenant to register)
-- =========================================================================
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);

-- =========================================================================
-- LEASES
-- =========================================================================
CREATE TABLE public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC(12,2) NOT NULL,
  deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  status public.lease_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER leases_updated_at BEFORE UPDATE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_leases_tenant ON public.leases(tenant_id);
CREATE INDEX idx_leases_landlord ON public.leases(landlord_id);
CREATE INDEX idx_leases_room ON public.leases(room_id);

-- =========================================================================
-- BOOKING REQUESTS
-- =========================================================================
CREATE TABLE public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  move_in_date DATE,
  status public.booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER booking_requests_updated_at BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_booking_landlord ON public.booking_requests(landlord_id);
CREATE INDEX idx_booking_tenant ON public.booking_requests(tenant_id);

-- =========================================================================
-- PAYMENTS
-- =========================================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT NOT NULL DEFAULT 'cash',
  reference TEXT,
  notes TEXT,
  status public.payment_status NOT NULL DEFAULT 'paid',
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payments_lease ON public.payments(lease_id);

-- =========================================================================
-- MAINTENANCE TICKETS + COMMENTS
-- =========================================================================
CREATE TABLE public.maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'open',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON public.maintenance_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_tickets_landlord ON public.maintenance_tickets(landlord_id);
CREATE INDEX idx_tickets_tenant ON public.maintenance_tickets(tenant_id);

CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ticket_comments_ticket ON public.ticket_comments(ticket_id);

-- =========================================================================
-- ANNOUNCEMENTS
-- =========================================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_announcements_property ON public.announcements(property_id);

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read_at);

-- =========================================================================
-- AUDIT LOG (admin-only read)
-- =========================================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Landlords view tenants on their leases" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.leases l WHERE l.tenant_id = profiles.id AND l.landlord_id = auth.uid()
  ));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- properties
CREATE POLICY "Anyone views properties (public marketplace)" ON public.properties FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Landlord manages own properties" ON public.properties FOR ALL TO authenticated
  USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());

-- room_labels
CREATE POLICY "Landlord manages own labels" ON public.room_labels FOR ALL TO authenticated
  USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());
CREATE POLICY "Anyone views labels" ON public.room_labels FOR SELECT TO anon, authenticated
  USING (true);

-- rooms (public read for marketplace; landlord writes)
CREATE POLICY "Anyone views rooms" ON public.rooms FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Landlord manages own rooms" ON public.rooms FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = rooms.property_id AND p.landlord_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = rooms.property_id AND p.landlord_id = auth.uid()));

-- invitations
CREATE POLICY "Landlord manages own invitations" ON public.invitations FOR ALL TO authenticated
  USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());

-- leases
CREATE POLICY "Tenant views own leases" ON public.leases FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());
CREATE POLICY "Landlord manages own leases" ON public.leases FOR ALL TO authenticated
  USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());

-- booking_requests
CREATE POLICY "Tenant creates own booking" ON public.booking_requests FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "Tenant views own bookings" ON public.booking_requests FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());
CREATE POLICY "Tenant cancels own pending booking" ON public.booking_requests FOR UPDATE TO authenticated
  USING (tenant_id = auth.uid() AND status = 'pending');
CREATE POLICY "Landlord manages bookings on own rooms" ON public.booking_requests FOR ALL TO authenticated
  USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());

-- payments
CREATE POLICY "Tenant views own payments" ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leases l WHERE l.id = payments.lease_id AND l.tenant_id = auth.uid()));
CREATE POLICY "Landlord manages payments on own leases" ON public.payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leases l WHERE l.id = payments.lease_id AND l.landlord_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.leases l WHERE l.id = payments.lease_id AND l.landlord_id = auth.uid()));

-- maintenance_tickets
CREATE POLICY "Tenant creates own ticket" ON public.maintenance_tickets FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "Tenant views own tickets" ON public.maintenance_tickets FOR SELECT TO authenticated
  USING (tenant_id = auth.uid());
CREATE POLICY "Tenant updates own ticket" ON public.maintenance_tickets FOR UPDATE TO authenticated
  USING (tenant_id = auth.uid());
CREATE POLICY "Landlord manages tickets on own rooms" ON public.maintenance_tickets FOR ALL TO authenticated
  USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());

-- ticket_comments
CREATE POLICY "Participants view comments" ON public.ticket_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.maintenance_tickets t
    WHERE t.id = ticket_comments.ticket_id
    AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
  ));
CREATE POLICY "Participants add comments" ON public.ticket_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.maintenance_tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND (t.tenant_id = auth.uid() OR t.landlord_id = auth.uid())
    )
  );

-- announcements
CREATE POLICY "Landlord manages own announcements" ON public.announcements FOR ALL TO authenticated
  USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());
CREATE POLICY "Tenants view announcements for their property" ON public.announcements FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.leases l
    JOIN public.rooms r ON r.id = l.room_id
    WHERE r.property_id = announcements.property_id AND l.tenant_id = auth.uid()
  ));

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users mark own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- audit_logs
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
