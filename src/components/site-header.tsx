import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  const { user, roles, signOut, loading } = useAuth();
  const dashHref = roles.includes("landlord") ? "/landlord" : "/tenant";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark className="h-9 w-9" />
          <span className="font-display text-xl font-semibold tracking-tight">TenApp</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/browse" className="text-muted-foreground transition-colors hover:text-foreground">
            Browse rooms
          </Link>
          <a href="/#features" className="text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="/#pricing" className="text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to={dashHref}>Dashboard</Link>
              </Button>
              <Button onClick={signOut} variant="outline" size="sm">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
