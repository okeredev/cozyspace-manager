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
  UserPlus,
  KeyRound,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useInView,
  animate,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

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

  // Page-wide scroll progress (top bar)
  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-primary via-primary-deep to-gold"
        style={{ scaleX: progressScale }}
      />
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

          {/* Floating 3D isometric building / room cards */}
          <motion.div
            className="relative h-[520px] [perspective:1400px]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          >
            {/* Ambient floor glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-8 bottom-6 h-28 rounded-[100%] blur-2xl"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 35%, transparent), transparent 70%)",
              }}
            />

            {/* 3D scene that tilts with the mouse */}
            <motion.div
              className="absolute inset-0"
              style={{
                rotateX: tiltX,
                rotateY: tiltY,
                transformStyle: "preserve-3d",
              }}
            >
              {(() => {
                const rooms = [
                  { n: "A-301", s: "Occupied", price: "$1,420", accent: "bg-primary", top: "6%", left: "32%", z: 140, delay: 0 },
                  { n: "A-204", s: "Reserved", price: "$1,180", accent: "bg-gold", top: "26%", left: "8%", z: 80, delay: 0.3 },
                  { n: "A-205", s: "Vacant", price: "$1,050", accent: "bg-muted-foreground/60", top: "30%", left: "56%", z: 60, delay: 0.6 },
                  { n: "A-102", s: "Occupied", price: "$980", accent: "bg-primary", top: "54%", left: "22%", z: 20, delay: 0.9 },
                  { n: "A-106", s: "Maintenance", price: "—", accent: "bg-destructive/80", top: "58%", left: "58%", z: -20, delay: 1.2 },
                ] as const;

                return rooms.map((r, i) => (
                  <motion.div
                    key={r.n}
                    className="absolute w-[58%] rounded-2xl border border-border/60 bg-card/90 p-4 shadow-2xl backdrop-blur-md"
                    style={{
                      top: r.top,
                      left: r.left,
                      transform: `translateZ(${r.z}px)`,
                      transformStyle: "preserve-3d",
                      boxShadow:
                        "0 30px 60px -20px color-mix(in oklab, var(--primary-deep) 35%, transparent), 0 8px 20px -6px color-mix(in oklab, var(--primary) 20%, transparent)",
                    }}
                    initial={{ opacity: 0, y: 30, rotateZ: -4 }}
                    animate={{
                      opacity: 1,
                      y: [0, -10, 0],
                      rotateZ: i % 2 === 0 ? [-2, 1, -2] : [2, -1, 2],
                    }}
                    transition={{
                      opacity: { duration: 0.6, delay: 0.2 + r.delay * 0.2 },
                      y: { duration: 5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: r.delay },
                      rotateZ: { duration: 7 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: r.delay },
                    }}
                    whileHover={{ scale: 1.04, transition: { duration: 0.25 } }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Room</div>
                        <div className="font-display text-lg font-semibold">{r.n}</div>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-1 text-[10px] font-medium">
                        <motion.span
                          className={`h-1.5 w-1.5 rounded-full ${r.accent}`}
                          animate={r.s === "Occupied" ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        />
                        {r.s}
                      </div>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div className="font-display text-xl font-semibold text-primary-deep">
                        {r.price}
                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">/mo</span>
                      </div>
                      <div className="flex -space-x-1">
                        {[0, 1, 2].map((k) => (
                          <div
                            key={k}
                            className="h-5 w-5 rounded-full border-2 border-card"
                            style={{
                              background: `linear-gradient(135deg, color-mix(in oklab, var(--primary) ${30 + k * 20}%, var(--gold)), color-mix(in oklab, var(--primary-deep) 50%, transparent))`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ));
              })()}

              {/* Floating accent particles in 3D space */}
              <motion.div
                aria-hidden
                className="absolute left-[10%] top-[10%] h-2.5 w-2.5 rounded-full bg-primary shadow-lg shadow-primary/60"
                style={{ transform: "translateZ(180px)" }}
                animate={{ y: [0, -14, 0], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="absolute right-[6%] top-[18%] h-3 w-3 rounded-full bg-gold shadow-lg shadow-gold/50"
                style={{ transform: "translateZ(220px)" }}
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="absolute bottom-[8%] right-[18%] h-2 w-2 rounded-full bg-primary-deep"
                style={{ transform: "translateZ(160px)" }}
                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Connector lines hinting at a building structure */}
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
                style={{ transform: "translateZ(0px)" }}
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M 60 80 L 220 140 L 380 200 L 240 320 L 100 380"
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="1.2"
                  strokeDasharray="4 6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS — animated counters */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          {[
            { label: "Properties managed", value: 1240, suffix: "+" },
            { label: "Rent collected", value: 4.8, suffix: "M", prefix: "$", decimals: 1 },
            { label: "Tickets resolved", value: 9620, suffix: "" },
            { label: "Avg. response", value: 12, suffix: "m" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-4xl font-semibold tracking-tight text-primary-deep md:text-5xl">
                {s.prefix}
                <Counter to={s.value} decimals={s.decimals ?? 0} />
                {s.suffix}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative container mx-auto px-4 py-24">
        <FeaturesBackdrop />
        <motion.div
          className="relative mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary-deep">
            <Sparkles className="h-3 w-3" /> Features
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Everything a landlord{" "}
            <span className="relative inline-block">
              actually
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-10 h-2 rounded-full bg-gold/50"
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
              />
            </span>{" "}
            needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            Not a generic CRM. Purpose-built for residential property operations.
          </p>
        </motion.div>
        <div className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6"
              initial={{ opacity: 0, y: 30, rotateX: -8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
              whileHover={{ y: -6 }}
              style={{ transformPerspective: 800 }}
            >
              <div
                aria-hidden
                className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(60% 60% at 30% 0%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)",
                }}
              />
              <motion.span
                className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"
                whileHover={{ scale: 1.15, rotate: 6 }}
                transition={{ type: "spring", stiffness: 280, damping: 14 }}
              >
                <f.icon className="h-5 w-5" />
              </motion.span>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Learn more <ArrowRight className="h-3 w-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — scroll-driven timeline */}
      <HowItWorks />

      {/* TRUST MARQUEE */}
      <section className="border-y bg-muted/20 py-10">
        <div className="container mx-auto px-4">
          <p className="mb-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by independent landlords across 12 cities
          </p>
          <div className="relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
            <motion.div
              className="flex gap-12 whitespace-nowrap font-display text-2xl text-muted-foreground"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            >
              {[0, 1].map((dup) => (
                <div key={dup} className="flex shrink-0 items-center gap-12 pr-12">
                  {["Sunset Heights", "Maple Court", "Riverside Lofts", "Oak & Vine", "The Northgate", "Harbour Row", "Cedar Mews"].map((n) => (
                    <span key={n} className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary/60" /> {n}
                    </span>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-primary-deep px-8 py-20 text-center text-primary-foreground"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--gold) 40%, transparent), transparent 70%)",
            }}
            animate={{ x: [0, 60, 0], y: [0, 20, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 right-1/4 h-[380px] w-[380px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 50%, transparent), transparent 70%)",
            }}
            animate={{ x: [0, -50, 0], y: [0, -20, 0], scale: [1.1, 1, 1.1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          {[...Array(8)].map((_, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute h-2 w-2 rounded-sm bg-gold/60"
              style={{ top: `${15 + (i * 9) % 70}%`, left: `${(i * 13 + 5) % 95}%` }}
              animate={{ y: [0, -16, 0], opacity: [0.3, 1, 0.3], rotate: [0, 90, 0] }}
              transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            />
          ))}
          <h2 className="relative font-display text-4xl font-semibold md:text-5xl">
            Free while we're in early access.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl opacity-80">
            Sign up as a landlord today. Invite tenants and manage your entire portfolio with no usage limits.
          </p>
          <motion.div
            className="relative mt-8 inline-block"
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <Button asChild size="lg" variant="secondary" className="h-12 px-6 shadow-xl">
              <Link to="/signup">
                Create your account <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
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

/* ---------- Animated counter ---------- */
function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to]);

  return <span ref={ref}>{val.toFixed(decimals)}</span>;
}

/* ---------- Section backdrop reacting to scroll ---------- */
function FeaturesBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["15%", "-15%"]);
  const rot = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute left-[-10%] top-[10%] h-[420px] w-[420px] rounded-full blur-3xl"
        style={{
          y: y1,
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)",
        }}
      />
      <motion.div
        className="absolute right-[-10%] bottom-[10%] h-[460px] w-[460px] rounded-full blur-3xl"
        style={{
          y: y2,
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--gold) 22%, transparent), transparent 70%)",
        }}
      />
      <motion.div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          rotate: rot,
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

/* ---------- How it works: scroll-driven timeline ---------- */
function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 40%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const steps = [
    {
      icon: Building2,
      title: "Add your properties",
      desc: "Import or create properties, label rooms, set rent and renewal amounts in minutes.",
    },
    {
      icon: UserPlus,
      title: "Invite your tenants",
      desc: "Send a single invite link. Tenants onboard themselves with ID, contacts, and lease acceptance.",
    },
    {
      icon: KeyRound,
      title: "Collect rent & resolve tickets",
      desc: "Record payments, issue receipts, and handle maintenance tickets — all in one workspace.",
    },
    {
      icon: TrendingUp,
      title: "Watch your portfolio grow",
      desc: "Get expiring-lease alerts, occupancy stats, and a clean handover at renewal time.",
    },
  ];

  return (
    <section className="relative container mx-auto px-4 py-24" ref={ref}>
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary-deep">
          How it works
        </span>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          From keys to cash flow,{" "}
          <span className="bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
            in four steps
          </span>
        </h2>
      </motion.div>

      <div className="relative mx-auto mt-16 max-w-3xl">
        {/* Background rail */}
        <div className="absolute left-6 top-2 bottom-2 w-px bg-border md:left-1/2" />
        {/* Progress rail */}
        <motion.div
          className="absolute left-6 top-2 w-px bg-gradient-to-b from-primary via-primary-deep to-gold md:left-1/2"
          style={{ height: lineHeight }}
        />
        <ul className="space-y-14">
          {steps.map((s, i) => (
            <TimelineStep key={s.title} step={s} index={i} progress={scrollYProgress} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function TimelineStep({
  step,
  index,
  progress,
}: {
  step: { icon: typeof Building2; title: string; desc: string };
  index: number;
  progress: MotionValue<number>;
}) {
  const threshold = (index + 0.4) / 4;
  const dotScale = useTransform(progress, [threshold - 0.15, threshold], [0.6, 1.2]);
  const dotOpacity = useTransform(progress, [threshold - 0.2, threshold], [0.3, 1]);
  const Icon = step.icon;
  const isLeft = index % 2 === 0;

  return (
    <li className="relative grid grid-cols-[3rem_1fr] gap-4 md:grid-cols-2 md:gap-12">
      {/* Dot on the rail */}
      <motion.span
        aria-hidden
        className="absolute left-6 top-3 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-primary shadow-lg shadow-primary/40 md:left-1/2"
        style={{ scale: dotScale, opacity: dotOpacity }}
      />
      {/* Content */}
      <motion.div
        className={`col-start-2 md:col-start-${isLeft ? 1 : 2} ${isLeft ? "md:text-right md:pr-12" : "md:col-start-2 md:pl-12"}`}
        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className={`inline-flex items-center gap-2 ${isLeft ? "md:flex-row-reverse" : ""}`}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Step {index + 1}
          </span>
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
      </motion.div>
      {/* Spacer for the empty column on alternating side */}
      {isLeft ? <span className="hidden md:block" /> : <span className="hidden md:block md:col-start-1" />}
    </li>
  );
}

