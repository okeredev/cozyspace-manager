import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  Receipt,
  Inbox,
  Wrench,
  Megaphone,
  Settings,
  LogOut,
  Tag,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { BrandLockup } from "@/components/brand-mark";

const main = [
  { title: "Dashboard", url: "/landlord", icon: LayoutDashboard },
  { title: "Properties", url: "/landlord/properties", icon: Building2 },
  { title: "Rooms", url: "/landlord/rooms", icon: DoorOpen },
  { title: "Room labels", url: "/landlord/labels", icon: Tag },
];

const people = [
  { title: "Tenants", url: "/landlord/tenants", icon: Users },
  { title: "Booking requests", url: "/landlord/requests", icon: Inbox },
  { title: "Leases", url: "/landlord/leases", icon: FileText },
];

const ops = [
  { title: "Payments", url: "/landlord/payments", icon: Receipt },
  { title: "Maintenance", url: "/landlord/tickets", icon: Wrench },
  { title: "Announcements", url: "/landlord/announcements", icon: Megaphone },
];

export function LandlordSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { signOut, user } = useAuth();
  const isActive = (url: string) => path === url || path.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-3">
          <BrandLockup sub="Landlord" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {[
          { label: "Manage", items: main },
          { label: "People", items: people },
          { label: "Operations", items: ops },
        ].map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/landlord/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              <span className="truncate">Sign out ({user?.email})</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
