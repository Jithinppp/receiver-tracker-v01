import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import TopBar from "@/components/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Receiver Tracker — Bosch LBB Conference Desk",
  description:
    "Issue and return Bosch LBB receivers at conferences. Kiosk collect and return with an admin record.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} flex min-h-full flex-col`}
      >
        <AuthProvider>
          <div className="ambient" aria-hidden="true" />
          <TopBar />
          <div className="relative z-10 flex-1">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
