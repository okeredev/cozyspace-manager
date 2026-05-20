import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/tenant/announcements")({
  component: () => <ComingSoon title="Announcements" desc="Messages from your landlord — Phase 7." />,
});
