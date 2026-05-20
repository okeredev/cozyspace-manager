import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import {
  Building2,
  Users,
  Receipt,
  Wrench,
  CalendarClock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "RentHub — Modern property management for landlords & tenants" },
      {
        name: "description",
        content:
          "All-in-one platform to manage properties, rooms, tenants, leases, rent, and maintenance. Built for serious landlords.",
      },
    ],
  }),
});

const features = [
  { icon: Building2, title: "Properties & rooms", desc: "Organize units, label them, and track occupancy at a glance." },
  { icon: Users, title: "Tenant profiles", desc: "Full tenant records: ID docs, emergency contacts, and history." },
  { icon: Receipt, title: "Rent & payments", desc: "Record payments, issue receipts, and never lose track of a balance." },
  { icon: Wrench, title: "Maintenance tickets", desc: "Tenants raise issues, landlords resolve them — with photos." },
  { icon: CalendarClock, title: "Lease lifecycle", desc: "Auto-flag expiring leases 30, 15, and 7 days out." },
  { icon: ShieldCheck, title: "Role-based access", desc: "Landlords and tenants see exactly what they should — nothing more." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent), radial-gradient(40% 40% at 100% 20%, color-mix(in oklab, var(--gold) 16%, transparent), transparent)",
          }}
        />
        <div className="container mx-auto grid items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Built for serious landlords
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Property management,{" "}
              <span className="italic text-primary-deep">refined.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              RentHub gives landlords full visibility over properties, rooms, leases, rent, and
              maintenance — and gives tenants a clean home for everything that matters.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6">
                <Link to="/signup">
                  Start managing properties <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6">
                <Link to="/browse">Browse available rooms</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {["No credit card", "Unlimited properties", "Tenant invitations", "Role-based security"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-3xl border bg-card p-2 shadow-2xl shadow-primary-deep/10">
              <div className="rounded-2xl bg-primary-deep p-6 text-primary-foreground">
                <div className="flex items-center justify-between text-xs opacity-80">
                  <span>Sunset Heights — Block A</span>
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-gold-foreground">
                    92% occupied
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { n: "A-101", s: "Occupied", c: "bg-primary" },
                    { n: "A-102", s: "Reserved", c: "bg-gold" },
                    { n: "A-103", s: "Vacant", c: "bg-muted/40" },
                    { n: "A-104", s: "Occupied", c: "bg-primary" },
                    { n: "A-105", s: "Occupied", c: "bg-primary" },
                    { n: "A-106", s: "Maintenance", c: "bg-destructive/70" },
                  ].map((r) => (
                    <div key={r.n} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-sm font-semibold">{r.n}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] opacity-80">
                        <span className={`h-1.5 w-1.5 rounded-full ${r.c}`} />
                        {r.s}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="opacity-70">This month</div>
                    <div className="mt-1 font-display text-2xl">$12,480</div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="opacity-70">Expiring soon</div>
                    <div className="mt-1 font-display text-2xl">3 leases</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight">
            Everything a landlord actually needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not a generic CRM. Purpose-built for residential property operations.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container mx-auto px-4 pb-24">
        <div className="rounded-3xl bg-primary-deep px-8 py-16 text-center text-primary-foreground">
          <h2 className="font-display text-4xl font-semibold">Free while we're in early access.</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-80">
            Sign up as a landlord today. Invite tenants and manage your entire portfolio with no usage limits.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-6">
            <Link to="/signup">Create your account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} RentHub</span>
          <span>Crafted for landlords and the tenants who deserve better.</span>
        </div>
      </footer>
    </div>
  );
}
