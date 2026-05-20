import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Search, ShieldPlus, ShieldMinus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

type Role = "admin" | "landlord" | "tenant";
const ROLES: Role[] = ["admin", "landlord", "tenant"];

function AdminUsers() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [q, setQ] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,phone,created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-all-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id,role");
      return data ?? [];
    },
  });

  const rolesByUser = new Map<string, Role[]>();
  (roles ?? []).forEach((r: any) => {
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(r.role);
    rolesByUser.set(r.user_id, list);
  });

  const filtered = (profiles ?? []).filter((p: any) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(needle) ||
      p.phone?.toLowerCase().includes(needle) ||
      p.id.toLowerCase().includes(needle)
    );
  });

  async function grant(userId: string, role: Role) {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    qc.invalidateQueries({ queryKey: ["admin-all-roles"] });
  }

  async function revoke(userId: string, role: Role) {
    if (userId === me?.id && role === "admin") {
      return toast.error("You cannot remove your own admin role.");
    }
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) return toast.error(error.message);
    toast.success(`Revoked ${role}`);
    qc.invalidateQueries({ queryKey: ["admin-all-roles"] });
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold">Users & roles</h1>
          <p className="text-sm text-muted-foreground">
            Grant or revoke admin, landlord, and tenant access.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone, or user id…"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div>User</div>
            <div>Roles & actions</div>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No users match.
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p: any) => {
                const userRoles = rolesByUser.get(p.id) ?? [];
                return (
                  <li
                    key={p.id}
                    className="grid grid-cols-1 items-center gap-3 px-5 py-4 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="font-medium">{p.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.phone ?? "no phone"} · {p.id.slice(0, 8)}…
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {userRoles.map((r) => (
                        <Badge key={r} variant="secondary" className="capitalize">
                          {r}
                          <button
                            onClick={() => revoke(p.id, r)}
                            className="ml-1.5 text-muted-foreground hover:text-destructive"
                            aria-label={`Revoke ${r}`}
                          >
                            <ShieldMinus className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {ROLES.filter((r) => !userRoles.includes(r)).map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant="outline"
                          onClick={() => grant(p.id, r)}
                        >
                          <ShieldPlus className="mr-1 h-3 w-3" />
                          <span className="capitalize">{r}</span>
                        </Button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
