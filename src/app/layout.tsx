import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlaceOn | Campus Placement Monitor",
  description:
    "PlaceOn — Centralized campus placement monitor for IU Jaipur students and placement coordinators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
