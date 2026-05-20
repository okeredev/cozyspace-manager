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
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "TenApp — Modern property management for landlords & tenants" },
      {
        name: "description",
        content:
          "TenApp is an all-in-one platform to manage properties, rooms, tenants, leases, rent, and maintenance. Built for serious landlords.",
      },
      { property: "og:title", content: "TenApp — Property management, refined" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
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
  // Mouse-tracking parallax for hero
  const heroRef = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 80, damping: 20, mass: 0.5 });
  const smy = useSpring(my, { stiffness: 80, damping: 20, mass: 0.5 });

  // Parallax derived transforms
  const orb1X = useTransform(smx, [-1, 1], [-40, 40]);
  const orb1Y = useTransform(smy, [-1, 1], [-30, 30]);
  const orb2X = useTransform(smx, [-1, 1], [30, -30]);
  const orb2Y = useTransform(smy, [-1, 1], [20, -20]);
  const orb3X = useTransform(smx, [-1, 1], [-20, 20]);
  const orb3Y = useTransform(smy, [-1, 1], [25, -25]);

  // Card tilt
  const tiltX = useTransform(smy, [-1, 1], [8, -8]);
  const tiltY = useTransform(smx, [-1, 1], [-10, 10]);
  const cardLift = useTransform(smy, [-1, 1], [10, -10]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      mx.set(Math.max(-1, Math.min(1, x)));
      my.set(Math.max(-1, Math.min(1, y)));
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [mx, my]);

  // Subtle scroll parallax on hero content
  const { scrollY } = useScroll();
  const heroFade = useTransform(scrollY, [0, 400], [1, 0.4]);
  const heroLift = useTransform(scrollY, [0, 400], [0, -40]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Animated gradient orbs that react to mouse */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full blur-3xl"
            style={{
              x: orb1X,
              y: orb1Y,
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 35%, transparent), transparent 70%)",
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -top-24 right-[-120px] h-[480px] w-[480px] rounded-full blur-3xl"
            style={{
              x: orb2X,
              y: orb2Y,
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--gold) 38%, transparent), transparent 70%)",
            }}
            animate={{ scale: [1.05, 1, 1.05] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[-160px] left-[20%] h-[460px] w-[460px] rounded-full blur-3xl"
            style={{
              x: orb3X,
              y: orb3Y,
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--primary-deep) 30%, transparent), transparent 70%)",
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <motion.div
          style={{ opacity: heroFade, y: heroLift }}
          className="container mx-auto grid items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary-deep">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Built for serious landlords
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Property management,{" "}
              <span className="bg-gradient-to-r from-primary via-primary-deep to-gold bg-clip-text italic text-transparent">
                refined.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              TenApp gives landlords full visibility over properties, rooms, leases, rent, and
              maintenance — and gives tenants a clean home for everything that matters.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="group h-12 px-6 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
                <Link to="/signup">
                  Start managing properties{" "}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 backdrop-blur">
                <Link to="/browse">Browse available rooms</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {["No credit card", "Unlimited properties", "Tenant invitations", "Role-based security"].map((t, i) => (
                <motion.li
                  key={t}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* 3D-tilting dashboard card with floating accents */}
          <motion.div
            className="relative [perspective:1200px]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          >
            {/* Floating accent dots */}
            <motion.div
              aria-hidden
              className="absolute -left-6 top-10 h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"
              style={{ x: orb1X, y: orb1Y }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -right-4 top-24 h-4 w-4 rounded-full bg-gold shadow-lg shadow-gold/40"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-4 left-10 h-2.5 w-2.5 rounded-full bg-primary-deep"
              animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              className="rounded-3xl border bg-card p-2 shadow-2xl shadow-primary-deep/20"
              style={{
                rotateX: tiltX,
                rotateY: tiltY,
                y: cardLift,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-primary-deep p-6 text-primary-foreground">
                {/* Shimmer */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-120%", "220%"] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                />
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
                  ].map((r, i) => (
                    <motion.div
                      key={r.n}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.06, duration: 0.4 }}
                      whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      <div className="text-sm font-semibold">{r.n}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] opacity-80">
                        <motion.span
                          className={`h-1.5 w-1.5 rounded-full ${r.c}`}
                          animate={r.s === "Occupied" ? { scale: [1, 1.4, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        />
                        {r.s}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <motion.div
                    className="rounded-xl bg-white/5 p-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    <div className="opacity-70">This month</div>
                    <div className="mt-1 font-display text-2xl">$12,480</div>
                  </motion.div>
                  <motion.div
                    className="rounded-xl bg-white/5 p-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.15, duration: 0.5 }}
                  >
                    <div className="opacity-70">Expiring soon</div>
                    <div className="mt-1 font-display text-2xl">3 leases</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container mx-auto px-4 py-20">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl font-semibold tracking-tight">
            Everything a landlord actually needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not a generic CRM. Purpose-built for residential property operations.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div
                aria-hidden
                className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(60% 60% at 30% 0%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)",
                }}
              />
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container mx-auto px-4 pb-24">
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-primary-deep px-8 py-16 text-center text-primary-foreground"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--gold) 35%, transparent), transparent 70%)",
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <h2 className="relative font-display text-4xl font-semibold">Free while we're in early access.</h2>
          <p className="relative mx-auto mt-3 max-w-xl opacity-80">
            Sign up as a landlord today. Invite tenants and manage your entire portfolio with no usage limits.
          </p>
          <Button asChild size="lg" variant="secondary" className="relative mt-8 h-12 px-6 transition-all hover:-translate-y-0.5 hover:shadow-xl">
            <Link to="/signup">Create your account</Link>
          </Button>
        </motion.div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} TenApp</span>
          <span>Crafted for landlords and the tenants who deserve better.</span>
        </div>
      </footer>
    </div>
  );
}
