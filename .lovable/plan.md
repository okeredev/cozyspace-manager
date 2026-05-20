
# RentHub — Tenant & Landlord Management Platform

A professional property management app where landlords manage properties, rooms, tenants, leases, and payments, and tenants can browse available rooms, request bookings, pay rent, and submit maintenance tickets.

## 1. Roles & Core Flows

**Landlord**
- Create properties and rooms (with labels: Single, Double, Ensuite, Studio, etc.)
- View occupancy, lease expiry, and rent status per room
- Approve/decline tenant room requests
- Manage tenant profiles (ID, contact, emergency contact, documents)
- Record rent payments, generate receipts/invoices
- Handle maintenance tickets and announcements

**Tenant**
- Sign up, complete profile, upload ID
- Browse available rooms (filter by label, price, location)
- Request to book a room
- View lease, rent due dates, payment history, receipts
- Submit & track maintenance tickets
- Receive announcements/notifications

**Admin (optional super-role)**
- Manage landlords, audit logs

## 2. Feature Set

Core
- Auth (email/password + Google) with role-based access
- Properties → Rooms → Leases → Tenants hierarchy
- Room labels/tags (color-coded), status (vacant/occupied/reserved/maintenance)
- Lease lifecycle: pending → active → expiring → expired/terminated
- Rent schedule, payment recording, balance tracking
- Documents storage (IDs, signed leases, receipts as PDF)
- Maintenance tickets with status workflow + comments
- Announcements (landlord → all tenants of a property)
- Dashboard with KPIs (occupancy %, monthly revenue, overdue rent, expiring leases)
- Notifications (in-app + email) for: booking approved, rent due, lease expiring, ticket update

Advanced
- Room availability calendar
- Auto-flag leases expiring in 30/15/7 days
- PDF generation for invoices, receipts, lease agreements
- CSV export of payments & tenants
- Search & filters across all entities
- Activity/audit log
- Dark mode, mobile-responsive, accessible

## 3. Pages / Routes

Public
- `/` landing (marketing, features, CTA)
- `/login`, `/signup`, `/reset-password`
- `/browse` public room marketplace
- `/rooms/$roomId` public room detail + "Request to book"

Tenant (`/_authenticated/tenant/...`)
- `/tenant` dashboard (my room, next payment, tickets)
- `/tenant/lease`, `/tenant/payments`, `/tenant/tickets`, `/tenant/profile`, `/tenant/announcements`

Landlord (`/_authenticated/landlord/...`)
- `/landlord` dashboard (KPIs, alerts)
- `/landlord/properties`, `/landlord/properties/$id`
- `/landlord/rooms`, `/landlord/rooms/$id`
- `/landlord/tenants`, `/landlord/tenants/$id`
- `/landlord/leases`, `/landlord/leases/$id`
- `/landlord/payments`, `/landlord/requests` (booking requests)
- `/landlord/tickets`, `/landlord/announcements`, `/landlord/settings`

## 4. Database Schema (Lovable Cloud)

- `profiles` (id→auth.users, full_name, phone, avatar_url, id_doc_url, emergency_contact)
- `user_roles` (user_id, role: 'landlord'|'tenant'|'admin') — separate table for security
- `properties` (id, landlord_id, name, address, description, photos)
- `rooms` (id, property_id, name/number, label, price, capacity, status, photos, amenities)
- `room_labels` (id, landlord_id, name, color) — custom labels
- `booking_requests` (id, room_id, tenant_id, message, status, requested_at)
- `leases` (id, room_id, tenant_id, start_date, end_date, rent_amount, deposit, billing_cycle, status)
- `payments` (id, lease_id, amount, paid_on, method, reference, receipt_url, status)
- `maintenance_tickets` (id, room_id, tenant_id, title, description, priority, status, photos)
- `ticket_comments` (id, ticket_id, author_id, body)
- `announcements` (id, property_id, title, body, created_by)
- `notifications` (id, user_id, type, payload, read_at)
- `audit_logs` (id, actor_id, action, entity, entity_id, metadata)

RLS on every table; landlords only see their own properties/tenants/leases; tenants only their own data. Roles checked via `has_role()` SECURITY DEFINER function.

## 5. Tech & Architecture

- TanStack Start (already scaffolded) + Tailwind + shadcn/ui
- Lovable Cloud for DB, auth, storage (room photos, IDs, receipts), server functions
- `createServerFn` + `requireSupabaseAuth` for all data ops
- Zod validation on every input
- React Query for caching/invalidation
- Lucide icons, Recharts for dashboard charts
- PDF generation via `pdf-lib` in server functions
- Email notifications via Lovable Email
- Design: clean professional SaaS aesthetic (will offer palette/type/layout choices when we start building)

## 6. Build Phases

1. **Foundation** — Enable Cloud, auth (email + Google), roles table, profile onboarding, role-based routing
2. **Properties & Rooms** — Landlord CRUD for properties, rooms, custom labels, photo uploads
3. **Public marketplace** — `/browse` and room detail, booking request flow
4. **Tenants & Leases** — Approve requests → create lease, tenant profile management
5. **Payments** — Record payments, balance tracking, PDF receipts, payment history
6. **Maintenance** — Ticket submission, status workflow, comments, photo attachments
7. **Notifications & Announcements** — In-app + email, expiry alerts (cron via pg_cron)
8. **Dashboards & Reporting** — KPI cards, charts, CSV export, audit log
9. **Polish** — Empty states, loading skeletons, mobile pass, dark mode, accessibility, SEO

## 7. Open Questions Before Phase 1

- Single landlord (you) or multi-landlord SaaS?
- Currency & billing cycle defaults (monthly/weekly)?
- Need online rent payments (Stripe/Paddle) or just manual recording?
- Should tenants self-serve sign up, or landlord invites them?

Confirm the plan (or adjust) and I'll start with Phase 1.
