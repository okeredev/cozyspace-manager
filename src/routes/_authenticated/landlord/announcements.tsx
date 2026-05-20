import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/announcements")({
  component: () => <ComingSoon title="Announcements" desc="Broadcast to all tenants — Phase 7." />,
});
