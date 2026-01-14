import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import "../styles/animations.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Project Aether - AI OS",
  description: "Advanced AI Operating System experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Puter.js SDK for multi-model AI support */}
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body className={`${inter.variable} font-sans bg-warmwind-bg-black text-gray-200 antialiased selection:bg-warmwind-primary-amber/30`}>
        {children}
      </body>
    </html>
  );
}
