import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/settings")({
  component: () => <ComingSoon title="Settings" desc="Account & workspace settings — coming soon." />,
});
