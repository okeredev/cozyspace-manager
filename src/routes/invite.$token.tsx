import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { toast } from "sonner";

type InvitationPreview = {
  id: string;
  email: string;
  landlord_id: string;
  landlord_name: string | null;
  room_id: string | null;
  room_name: string | null;
  property_name: string | null;
  status: string;
  expires_at: string;
};

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
  head: () => ({
    meta: [
      { title: "You're invited — TenApp" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLookupBusy(true);
      const { data, error } = await supabase.rpc("lookup_invitation_by_token", {
        _token: token,
      });
      if (!active) return;
      if (error) {
        setLookupError(error.message);
      } else if (!data || data.length === 0) {
        setLookupError("This invitation is invalid, revoked, or expired.");
      } else {
        setPreview(data[0] as InvitationPreview);
      }
      setLookupBusy(false);
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function accept() {
    if (!user) return;
    setAccepting(true);
    const { error } = await supabase.rpc("accept_invitation", { _token: token });
    setAccepting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshRoles();
    toast.success("Welcome aboard");
    nav({ to: "/tenant" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-8">
          <div className="flex items-center gap-2">
            <BrandMark className="h-8 w-8" />
            <span className="font-display text-lg font-semibold">TenApp</span>
          </div>

          {lookupBusy ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking your invitation…
            </div>
          ) : lookupError || !preview ? (
            <div>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="font-display text-xl">Invitation unavailable</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {lookupError ?? "This link is no longer valid."}
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-2xl">You're invited</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {preview.landlord_name ?? "Your landlord"} has invited{" "}
                  <span className="font-medium text-foreground">
                    {preview.email}
                  </span>{" "}
                  to join TenApp
                  {preview.room_name
                    ? ` for ${preview.room_name} at ${preview.property_name}.`
                    : "."}
                </p>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading session…</p>
              ) : !user ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sign in or create an account using{" "}
                    <span className="font-medium text-foreground">
                      {preview.email}
                    </span>{" "}
                    to accept.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <Link
                        to="/login"
                        search={{ redirect: `/invite/${token}` }}
                      >
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to="/signup" search={{ invite: token }}>
                        Create account
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : user.email?.toLowerCase() !== preview.email.toLowerCase() ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  This invitation is for{" "}
                  <span className="font-medium">{preview.email}</span>, but you're
                  signed in as <span className="font-medium">{user.email}</span>.
                  Sign out and use the invited address.
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={accept}
                  disabled={accepting}
                >
                  {accepting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Accept invitation
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
