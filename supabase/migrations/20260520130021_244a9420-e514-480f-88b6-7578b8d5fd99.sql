
-- Expire any pending invitations whose expires_at has passed
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
$$;

-- Public preview of an invitation by token. Returns one row if pending+unexpired.
CREATE OR REPLACE FUNCTION public.lookup_invitation_by_token(_token TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  landlord_id UUID,
  landlord_name TEXT,
  room_id UUID,
  room_name TEXT,
  property_name TEXT,
  status public.invitation_status,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.email,
    i.landlord_id,
    pr.full_name AS landlord_name,
    i.room_id,
    r.name AS room_name,
    p.name AS property_name,
    i.status,
    i.expires_at
  FROM public.invitations i
  LEFT JOIN public.profiles pr ON pr.id = i.landlord_id
  LEFT JOIN public.rooms r ON r.id = i.room_id
  LEFT JOIN public.properties p ON p.id = r.property_id
  WHERE i.token = _token
    AND i.status = 'pending'
    AND i.expires_at > now()
  LIMIT 1;
END;
$$;

-- Authenticated user accepts an invitation by token.
CREATE OR REPLACE FUNCTION public.accept_invitation(_token TEXT)
RETURNS TABLE (invitation_id UUID, landlord_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_inv RECORD;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  IF v_inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  UPDATE public.invitations
  SET status = 'accepted',
      accepted_by = v_user,
      accepted_at = now()
  WHERE id = v_inv.id;

  -- Ensure tenant role exists for this user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user, 'tenant')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN QUERY SELECT v_inv.id, v_inv.landlord_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_invitation_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_old_invitations() TO authenticated;
