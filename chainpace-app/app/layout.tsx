import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import { UserProvider } from "@/lib/user-context";
import SessionSync from "@/components/SessionSync";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Chainpace",
  description:
    "Proof-of-habit, on-chain. Build routines with people who hold you to it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body`}
      >
        <ThemeProvider>
          <UserProvider>
            <SessionSync />
            {children}
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
