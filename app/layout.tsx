import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import "./sprites.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NightBackground from "@/components/NightBackground";
import UsernameGate from "@/components/UsernameGate";
import SignInGate from "@/components/SignInGate";
import XpBar from "@/components/XpBar";
import DayNightScroll from "@/components/DayNightScroll";
import RankNotice from "@/components/RankNotice";
import { getSession } from "@/lib/session";
import { getLinkByDiscord, linkingConfigured } from "@/lib/moonlink";

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

// DISCORD_CLIENT_ID unset is the kill switch — falls back to the old
// typed-username gate entirely. Session + the live Turso link lookup are
// read ONCE per request here and threaded down to both the gate and the
// header, instead of each doing its own fetch.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const discordConfigured = Boolean(process.env.DISCORD_CLIENT_ID);
  const session = discordConfigured ? await getSession() : null;
  const linkedPlayer = session ? (await getLinkByDiscord(session.discordId))?.player ?? null : null;

  return (
    <html lang="en" className={pixel.variable}>
      <body className="flex min-h-screen flex-col">
        <NightBackground />
        {discordConfigured ? (
          <SignInGate
            session={session}
            linkedPlayer={linkedPlayer}
            linkingConfigured={linkingConfigured()}
          />
        ) : (
          <UsernameGate />
        )}
        <RankNotice />
        <Header discordConfigured={discordConfigured} session={session} linkedPlayer={linkedPlayer} />
        <main className="flex-1">{children}</main>
        <Footer />
        <XpBar />
        <DayNightScroll />
      </body>
    </html>
  );
}
