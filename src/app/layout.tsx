import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/ui/components/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Insights",
  description: "How your club is doing: active players, sessions held and no-shows.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="h-14 border-b border-line bg-surface" />}>
          <AppHeader />
        </Suspense>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
