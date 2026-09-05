"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Mic2,
  ListMusic,
  PlusCircle,
  Settings,
  Sliders,
  Sparkles,
  Music,
} from "lucide-react";

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/library", label: "Cancionero", icon: BookOpen },
    { href: "/practice", label: "Práctica", icon: Mic2 },
    { href: "/setlists", label: "Setlists", icon: ListMusic },
    { href: "/songs/new", label: "Importar canción", icon: PlusCircle, highlight: true },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-studio-border bg-studio-surface text-studio-text flex-shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-studio-border/70 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-600 via-electric-500 to-violetStudio-600 flex items-center justify-center shadow-studio-glow">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-studio-text font-mono group-hover:text-electric-400 transition-colors">
              AKHUSTICO
            </h1>
            <span className="text-xs uppercase tracking-widest text-electric-400 font-medium">
              Studio
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        <div className="px-3 mb-2 text-[10px] uppercase font-bold tracking-widest text-studio-dimmed">
          Laboratorio
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                item.highlight
                  ? "bg-electric-600/20 text-electric-400 hover:bg-electric-600/30 border border-electric-500/30"
                  : isActive
                  ? "bg-studio-elevated text-electric-400 border border-studio-borderHighlight font-semibold"
                  : "text-studio-muted hover:text-studio-text hover:bg-studio-elevated/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-electric-400" : "text-studio-dimmed"}`} />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto w-2 h-2 rounded-full bg-electric-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings & Status Footer */}
      <div className="p-4 border-t border-studio-border/70 space-y-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/settings"
              ? "bg-studio-elevated text-electric-400"
              : "text-studio-muted hover:text-studio-text hover:bg-studio-elevated/40"
          }`}
        >
          <Settings className="w-4 h-4 text-studio-dimmed" />
          <span>Configuración</span>
        </Link>
        <div className="px-3 py-2 bg-studio-bg/60 rounded-lg border border-studio-border/50 text-[11px] text-studio-dimmed flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Worker: Listo
          </span>
          <span className="font-mono text-studio-muted">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
