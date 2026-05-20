
-- Drop public marketplace access
DROP POLICY IF EXISTS "Anyone views properties (public marketplace)" ON public.properties;
DROP POLICY IF EXISTS "Anyone views rooms" ON public.rooms;

-- Properties: landlord owner OR tenants invited by that landlord OR tenants with a lease in the property
CREATE POLICY "Invited tenants view landlord properties"
ON public.properties FOR SELECT TO authenticated
USING (
  landlord_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.invitations i
    WHERE i.landlord_id = properties.landlord_id
      AND i.accepted_by = auth.uid()
      AND i.status = 'accepted'
  )
  OR EXISTS (
    SELECT 1 FROM public.leases l
    JOIN public.rooms r ON r.id = l.room_id
    WHERE r.property_id = properties.id AND l.tenant_id = auth.uid()
  )
);

-- Rooms: landlord owner OR tenants invited by that landlord OR tenants with a lease on the room
CREATE POLICY "Invited tenants view landlord rooms"
ON public.rooms FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = rooms.property_id AND p.landlord_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.invitations i
    JOIN public.properties p ON p.landlord_id = i.landlord_id
    WHERE p.id = rooms.property_id
      AND i.accepted_by = auth.uid()
      AND i.status = 'accepted'
  )
  OR EXISTS (
    SELECT 1 FROM public.leases l
    WHERE l.room_id = rooms.id AND l.tenant_id = auth.uid()
  )
);
