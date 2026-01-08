import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import "../styles/animations.css";
import { ThemeController } from "@/components/ThemeController";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AETHER-OS v1.0.0",
  description: "Production-ready autonomous desktop OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans bg-warmwind-bg-black text-gray-200 antialiased selection:bg-warmwind-primary-amber/30`}
      >
        <ThemeController />
        {children}
      </body>
    </html>
  );
}
