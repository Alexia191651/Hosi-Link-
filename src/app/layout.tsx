import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-expect-error Next.js global CSS side-effect import
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HOSI-LINK - Healthcare Management System",
  description: "Centralized healthcare management for paramedics, ICU bed management, and blood bank personnel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}