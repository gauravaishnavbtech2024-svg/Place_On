import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlaceOn | Campus Placement Monitor",
  description:
    "PlaceOn — Centralized campus placement monitor for IcfaiTech (IU Jaipur) students and placement coordinators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fdfeff] text-[#18162b] antialiased">
        {children}
      </body>
    </html>
  );
}
