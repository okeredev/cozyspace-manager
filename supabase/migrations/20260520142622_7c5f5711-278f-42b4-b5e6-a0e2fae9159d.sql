
-- Helper to insert a notification (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid, _type text, _title text, _body text, _link text
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user_id, _type, _title, _body, _link)
$$;

-- Booking created → landlord
CREATE OR REPLACE FUNCTION public.notify_booking_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.landlord_id, 'booking',
    'New booking request',
    'A tenant requested to book one of your rooms.',
    '/landlord/requests'
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_booking_created ON public.booking_requests;
CREATE TRIGGER trg_notify_booking_created AFTER INSERT ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_created();

-- Booking status changed → tenant
CREATE OR REPLACE FUNCTION public.notify_booking_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.tenant_id, 'booking',
      'Booking ' || NEW.status,
      'Your booking request is now ' || NEW.status || '.',
      '/tenant'
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_booking_status ON public.booking_requests;
CREATE TRIGGER trg_notify_booking_status AFTER UPDATE ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status();

-- Payment recorded → tenant
CREATE OR REPLACE FUNCTION public.notify_payment_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.leases WHERE id = NEW.lease_id;
  IF v_tenant IS NOT NULL THEN
    PERFORM public.create_notification(
      v_tenant, 'payment',
      'Payment recorded',
      'A payment of ' || NEW.amount::text || ' was recorded on your lease.',
      '/tenant/payments'
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_payment_created ON public.payments;
CREATE TRIGGER trg_notify_payment_created AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.notify_payment_created();

-- Ticket created → landlord
CREATE OR REPLACE FUNCTION public.notify_ticket_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.landlord_id, 'ticket',
    'New maintenance ticket',
    NEW.title,
    '/landlord/tickets'
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_ticket_created ON public.maintenance_tickets;
CREATE TRIGGER trg_notify_ticket_created AFTER INSERT ON public.maintenance_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_created();

-- Ticket status changed → tenant
CREATE OR REPLACE FUNCTION public.notify_ticket_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(
      NEW.tenant_id, 'ticket',
      'Ticket ' || NEW.status,
      NEW.title,
      '/tenant/tickets'
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_ticket_status ON public.maintenance_tickets;
CREATE TRIGGER trg_notify_ticket_status AFTER UPDATE ON public.maintenance_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_status();

-- Ticket comment → other participant
CREATE OR REPLACE FUNCTION public.notify_ticket_comment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant uuid; v_landlord uuid; v_title text; v_recipient uuid; v_link text;
BEGIN
  SELECT tenant_id, landlord_id, title INTO v_tenant, v_landlord, v_title
  FROM public.maintenance_tickets WHERE id = NEW.ticket_id;
  IF NEW.author_id = v_tenant THEN
    v_recipient := v_landlord; v_link := '/landlord/tickets';
  ELSE
    v_recipient := v_tenant; v_link := '/tenant/tickets';
  END IF;
  PERFORM public.create_notification(
    v_recipient, 'ticket',
    'New comment on ticket',
    v_title,
    v_link
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_ticket_comment ON public.ticket_comments;
CREATE TRIGGER trg_notify_ticket_comment AFTER INSERT ON public.ticket_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_comment();

-- Announcement → all tenants on that property
CREATE OR REPLACE FUNCTION public.notify_announcement_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT DISTINCT l.tenant_id, 'announcement', NEW.title, NEW.body, '/tenant/announcements'
  FROM public.leases l
  JOIN public.rooms r ON r.id = l.room_id
  WHERE r.property_id = NEW.property_id AND l.status = 'active';
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_announcement_created ON public.announcements;
CREATE TRIGGER trg_notify_announcement_created AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.notify_announcement_created();

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
