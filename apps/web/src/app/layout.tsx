import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";

export const metadata: Metadata = {
  title: "AKHUSTICO Studio — Cancionero Inteligente + Music Lab + Vocal Coach",
  description: "Laboratorio musical personal para guitarra, cancionero inteligente, separación de stems y entrenamiento vocal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-studio-bg text-studio-text antialiased min-h-screen flex flex-col md:flex-row">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
          {children}
        </main>
        <MobileNavBar />
      </body>
    </html>
  );
}
