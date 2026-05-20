import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, CheckCircle2 } from "lucide-react";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create your landlord account — RentHub" }] }),
});

function SignupPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: parsed.data.fullName,
          role: "landlord",
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your email to confirm, then sign in.");
    nav({ to: "/login" });
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary-deep p-12 text-primary-foreground md:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold text-gold-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="font-display text-xl">RentHub</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl leading-tight">
            Run your properties like a real operator.
          </h2>
          <ul className="mt-6 space-y-3 text-sm opacity-90">
            {[
              "Unlimited properties, rooms, and tenants",
              "Invite tenants by email — they never see other tenants",
              "Record rent, generate receipts, track balances",
              "Maintenance tickets with photos and statuses",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-gold" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-60">Tenants join by invitation only.</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold">Create your landlord account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
              <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating…" : "Create account"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Looking to rent? Tenants join through an invite from their landlord.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
