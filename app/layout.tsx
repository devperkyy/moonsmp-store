import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import "./sprites.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NightBackground from "@/components/NightBackground";
import UsernameGate from "@/components/UsernameGate";
import XpBar from "@/components/XpBar";
import DayNightScroll from "@/components/DayNightScroll";
import RankNotice from "@/components/RankNotice";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: {
    default: "Moon SMP Store",
    template: "%s · Moon SMP Store",
  },
  description:
    "Support Moon SMP — ranks, crate keys and more, delivered in-game automatically. Java + Bedrock.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={pixel.variable}>
      <body className="flex min-h-screen flex-col">
        <NightBackground />
        <UsernameGate />
        <RankNotice />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <XpBar />
        <DayNightScroll />
      </body>
    </html>
  );
}
