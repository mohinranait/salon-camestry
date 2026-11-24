'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck, ExternalLink, FileText, Gauge, HardHat, ImageIcon, LayoutGrid, LogOut, Settings, Sparkles, UserCog, Users,
  UsersRound,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import { logout } from '@/app/admin/actions';

const groups = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: Gauge }],
  },
  {
    label: 'Website',
    items: [
      { href: '/admin/pages', label: 'Pages', icon: FileText },
      { href: '/admin/media', label: 'Media library', icon: ImageIcon },
      { href: '/admin/milestones', label: 'Build-out milestones', icon: HardHat },
      { href: '/admin/suites', label: 'Suites', icon: LayoutGrid },
      { href: '/admin/members', label: 'Member directory', icon: UsersRound },
    ],
  },
  {
    label: 'Inbox',
    items: [
      { href: '/admin/leads', label: 'VIP waitlist leads', icon: Users, badge: 'leads' as const },
      { href: '/admin/bookings', label: 'Tour bookings', icon: CalendarCheck, badge: 'bookings' as const },
    ],
  },
  {
    label: 'Configure',
    items: [
      { href: '/admin/settings', label: 'Site settings', icon: Settings },
      { href: '/admin/users', label: 'Admin users', icon: UserCog },
    ],
  },
];

export function AdminSidebar({ user, counts, phase }: { user: { name: string; email: string }; counts: { leads: number; bookings: number }; phase: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-black text-[#d6b46d]">
                <Sparkles className="size-4" />
              </span>
              <span className="grid leading-tight">
                <span className="font-semibold">Shear Chemistry</span>
                <span className="text-xs text-muted-foreground">{phase === 'phase2' ? 'Phase 2 · Live leasing' : 'Phase 1 · Pre-launch'}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const badge = 'badge' in item && item.badge ? counts[item.badge] : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton isActive={isActive(item.href)} tooltip={item.label} render={<Link href={item.href} />}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {badge > 0 && <SidebarMenuBadge className="bg-amber-100 text-amber-900">{badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="View website" render={<a href="/" target="_blank" rel="noreferrer" />}>
              <ExternalLink />
              <span>View website</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton type="submit" tooltip="Sign out">
                <LogOut />
                <span className="grid text-left leading-tight">
                  <span className="truncate">Sign out</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
