"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Mic2, PlusCircle, Settings } from "lucide-react";

export const MobileNavBar: React.FC = () => {
  const pathname = usePathname();

  // Si estamos dentro del lector de canción (/songs/[id]), el lector provee su propia barra especializada para tocar
  if (pathname.startsWith("/songs/") && pathname !== "/songs/new" && !pathname.endsWith("/edit")) {
    return null;
  }

  const items = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/library", label: "Cancionero", icon: BookOpen },
    { href: "/songs/new", label: "Importar", icon: PlusCircle, highlight: true },
    { href: "/practice", label: "Práctica", icon: Mic2 },
    { href: "/settings", label: "Ajustes", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-studio-surface/95 backdrop-blur-lg border-t border-studio-border z-40 flex items-center justify-around px-2 select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-1.5 rounded-lg transition-colors ${
              isActive ? "text-electric-400 font-semibold" : "text-studio-muted hover:text-studio-text"
            }`}
          >
            <Icon className={`w-5 h-5 ${item.highlight ? "text-electric-400" : ""}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
