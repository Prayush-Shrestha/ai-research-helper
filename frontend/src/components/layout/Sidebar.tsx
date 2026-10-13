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
  if (collapsed) return <div aria-hidden className="mx-3 my-3 h-px" style={{ background: "var(--color-line)" }} />;
  return (
    <p className="px-4 pb-1.5 pt-5" style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>
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
        <span style={{ color: active ? "var(--color-electric-blue)" : "var(--color-graphite)", display: "flex" }}>{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </>
    );
    const cls = "flex items-center gap-3 px-4 py-2 text-[15px]";
    const style: CSSProperties = {
      color: active ? "var(--color-apple-ink)" : "var(--color-iron)",
      fontWeight: active ? 600 : 400,
      background: active ? "var(--surface-elevated)" : "transparent",
      borderRadius: 10,
      borderLeft: active ? "2px solid var(--color-electric-blue)" : "2px solid transparent",
    };
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
      className="hidden shrink-0 flex-col lg:flex"
      style={{
        width: collapsed ? 76 : 248,
        background: "var(--surface-sidebar)",
        borderRight: "1px solid var(--color-line)",
        minHeight: "calc(100vh - 48px)",
        position: "sticky",
        top: 48,
        alignSelf: "flex-start",
        maxHeight: "calc(100vh - 48px)",
        overflowY: "auto",
        transition: "width 200ms ease",
      }}
    >
      <div className="flex items-center px-4 py-4" style={{ gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start" }}>
        {!collapsed && (
          <>
            <LogoMark size={26} />
            <p style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 17, fontWeight: 600, letterSpacing: "-0.019em", color: "var(--color-apple-ink)" }}>Lumina</p>
          </>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto p-1.5"
          style={{ color: "var(--color-slate)" }}
        >
          {collapsed ? <PanelLeftOpen size={17} aria-hidden /> : <PanelLeftClose size={17} aria-hidden />}
        </button>
        {!collapsed && <ThemeToggle tone="light" />}
      </div>

      <nav className="flex-1 px-2.5 pb-4" aria-label="Primary">
        <SectionLabel collapsed={collapsed}>Workspace</SectionLabel>
        <div className="space-y-0.5">{workspace.map(renderItem)}</div>
        <SectionLabel collapsed={collapsed}>Tools</SectionLabel>
        <div className="space-y-0.5">{tools.map(renderItem)}</div>
        {!collapsed && (
          <>
            <div aria-hidden className="mx-3 my-3 h-px" style={{ background: "var(--color-line)" }} />
            <div className="px-4">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>More</p>
              <div className="mt-1.5 flex flex-col gap-2 text-[15px]" style={{ color: "var(--color-iron)" }}>
                <Link href="/knowledge">Knowledge Map</Link>
                <Link href="/publish">Publish</Link>
                <Link href="/roadmap">Roadmap</Link>
                <Link href="/guide">Guide</Link>
              </div>
            </div>
          </>
        )}
        <SectionLabel collapsed={collapsed}>Account</SectionLabel>
        <div className="space-y-0.5">{account.map(renderItem)}</div>
      </nav>

      {!collapsed && (
        <div className="p-3" style={{ borderTop: "1px solid var(--color-line)" }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center text-[15px] font-semibold" style={{ background: "var(--color-ash)", color: "var(--color-apple-ink)", borderRadius: 999 }}>
              {(user?.name?.trim().charAt(0).toUpperCase() || "R")}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[15px] font-medium" style={{ color: "var(--color-apple-ink)" }}>{user?.name ?? "Researcher"}</p>
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
