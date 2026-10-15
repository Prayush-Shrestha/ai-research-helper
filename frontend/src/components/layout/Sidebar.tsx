"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FolderOpen,
  History,
  LayoutDashboard,
  MessagesSquare,
  NotebookPen,
  Quote,
  ScanText,
  Settings,
  Sparkles,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  href?: string;
  label: string;
  icon: ReactNode;
  action?: () => void;
}

function SectionLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
  if (collapsed) return <div aria-hidden className="mx-4 my-3 h-px" style={{ background: "var(--liquid-border)" }} />;
  return (
    <p className="px-4 pb-1.5 pt-5" style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-slate)" }}>
      {children}
    </p>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/documents" ? pathname.startsWith("/documents") : pathname === href || pathname.startsWith(`${href}/`);

  const renderItem = (item: NavItem) => {
    const active = item.href ? isActive(item.href) : false;
    const content = (
      <>
        <span style={{ color: active ? "var(--color-electric-blue)" : "var(--color-graphite)", display: "flex", filter: active ? "drop-shadow(0 0 8px rgba(157,231,193,0.5))" : undefined }}>{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </>
    );
    const cls = active
      ? "liquid-active-row flex items-center gap-3 px-4 py-2.5 text-[14.5px]"
      : "liquid-link flex items-center gap-3 px-4 py-2.5 text-[14.5px] w-full";
    const style: CSSProperties = active
      ? { color: "var(--color-apple-ink)", fontWeight: 600, borderRadius: 14 }
      : { color: "var(--color-iron)", fontWeight: 450, borderRadius: 14 };
    if (item.href) {
      return (
        <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={cls} style={style} title={item.label}>
          {content}
        </Link>
      );
    }
    return (
      <button key={item.label} type="button" onClick={item.action} className={cls} style={{ ...style, width: "100%", textAlign: "left" }} title={item.label}>
        {content}
      </button>
    );
  };

  const workspace: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={17} aria-hidden /> },
    { href: "/documents", label: "My Research", icon: <BookOpen size={17} aria-hidden /> },
    { href: "/collections", label: "Collections", icon: <FolderOpen size={17} aria-hidden /> },
    { href: "/assistant", label: "AI Conversations", icon: <MessagesSquare size={17} aria-hidden /> },
    { href: "/notes", label: "Saved Notes", icon: <NotebookPen size={17} aria-hidden /> },
    { href: "/history", label: "Research History", icon: <History size={17} aria-hidden /> },
  ];

  const tools: NavItem[] = [
    { href: "/assistant", label: "AI Paper Assistant", icon: <Sparkles size={17} aria-hidden /> },
    { href: "/insights", label: "Research Summaries", icon: <ScanText size={17} aria-hidden /> },
    { href: "/toolkit", label: "Citation Manager", icon: <Quote size={17} aria-hidden /> },
  ];

  const account: NavItem[] = [
    { href: "/settings", label: "Settings", icon: <Settings size={17} aria-hidden /> },
    { href: "/settings", label: "Profile", icon: <User size={17} aria-hidden /> },
    { label: "Sign out", icon: <LogOut size={17} aria-hidden />, action: logout },
  ];

  return (
    <aside
      aria-label="Workspace"
      className="liquid-sidebar hidden shrink-0 flex-col lg:flex"
      style={{
        width: collapsed ? 80 : 264,
        minHeight: "calc(100vh - var(--nav-h) - var(--nav-float) * 2 - 16px)",
        margin: "8px 0 8px 16px",
        borderRadius: 24,
        border: "1px solid var(--liquid-border)",
        position: "sticky",
        top: "calc(var(--nav-h) + var(--nav-float) * 2 + 8px)",
        alignSelf: "flex-start",
        maxHeight: "calc(100vh - var(--nav-h) - var(--nav-float) * 2 - 16px)",
        overflowY: "auto",
        transition: "width 220ms cubic-bezier(0.22,1,0.36,1)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 var(--liquid-shine)",
      }}
    >
      <div className="flex items-center px-4 py-4" style={{ gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start" }}>
        {!collapsed && (
          <>
            <LogoMark size={28} />
            <p style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>Lumina</p>
          </>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="liquid-link ml-auto flex h-8 w-8 items-center justify-center"
          style={{ color: "var(--color-slate)" }}
        >
          {collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />}
        </button>
        {!collapsed && <ThemeToggle tone="light" />}
      </div>

      <nav className="flex-1 px-3 pb-4" aria-label="Primary">
        <SectionLabel collapsed={collapsed}>Workspace</SectionLabel>
        <div className="space-y-1">{workspace.map(renderItem)}</div>
        <SectionLabel collapsed={collapsed}>Tools</SectionLabel>
        <div className="space-y-1">{tools.map(renderItem)}</div>
        {!collapsed && (
          <>
            <div aria-hidden className="mx-3 my-4 h-px" style={{ background: "var(--liquid-border)" }} />
            <div className="mx-1 rounded-2xl px-3.5 py-3.5" style={{ background: "rgba(157,231,193,0.07)", border: "1px solid rgba(157,231,193,0.18)" }}>
              <p style={{ fontSize: 13, fontWeight: 650, color: "var(--color-apple-ink)" }}>Explore more</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[13.5px]" style={{ color: "var(--color-iron)" }}>
                <Link href="/knowledge" className="liquid-link justify-center !px-2">Knowledge</Link>
                <Link href="/publish" className="liquid-link justify-center !px-2">Publish</Link>
                <Link href="/roadmap" className="liquid-link justify-center !px-2">Roadmap</Link>
                <Link href="/guide" className="liquid-link justify-center !px-2">Guide</Link>
              </div>
            </div>
          </>
        )}
        <SectionLabel collapsed={collapsed}>Account</SectionLabel>
        <div className="space-y-1">{account.map(renderItem)}</div>
      </nav>

      {!collapsed && (
        <div className="p-3">
          <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--liquid-border)", backdropFilter: "blur(12px)" }}>
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center text-[15px] font-semibold" style={{ background: "linear-gradient(180deg, var(--color-electric-blue), #6FCF9A)", color: "#06110C", borderRadius: 999, boxShadow: "0 4px 14px rgba(157,231,193,0.35)" }}>
              {(user?.name?.trim().charAt(0).toUpperCase() || "R")}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[14px] font-semibold" style={{ color: "var(--color-apple-ink)" }}>{user?.name ?? "Researcher"}</p>
              <p className="truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>{user?.email ?? ""}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  return { collapsed, toggle: () => setCollapsed((v) => !v), setCollapsed };
}
