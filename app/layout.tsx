import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import "./sprites.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NightBackground from "@/components/NightBackground";
import UsernameGate from "@/components/UsernameGate";
import SignInGate from "@/components/SignInGate";
import MaintenanceGate from "@/components/MaintenanceGate";
import XpBar from "@/components/XpBar";
import DayNightScroll from "@/components/DayNightScroll";
import RankNotice from "@/components/RankNotice";
import { discordAuthConfigured } from "@/lib/discord";
import { getSession } from "@/lib/session";
import { getLinkByDiscord } from "@/lib/moonlink";
import { getMaintenanceState, isAllowedDuringMaintenance } from "@/lib/maintenance";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const discordAuth = discordAuthConfigured();
  const session = discordAuth ? await getSession() : null;
  let linkedPlayer: string | null = null;
  if (session) {
    try {
      linkedPlayer = (await getLinkByDiscord(session.discordId))?.player ?? null;
    } catch {
      // The link service being down should not crash public/legal/admin pages.
    }
  }

  let maintenance = { enabled: false, message: "", allowlist: [] as string[] };
  try {
    maintenance = await getMaintenanceState();
  } catch {
    // No MaintenanceMode row / DB hiccup — default to open for business.
  }
  const maintenanceAllowed = isAllowedDuringMaintenance(maintenance, session?.discordUsername);

  return (
    <html lang="en" className={pixel.variable}>
      <body className="flex min-h-screen flex-col">
        <NightBackground />
        <MaintenanceGate
          enabled={maintenance.enabled}
          message={maintenance.message}
          allowed={maintenanceAllowed}
        />
        {discordAuth ? (
          <SignInGate session={session} linkedPlayer={linkedPlayer} />
        ) : (
          <UsernameGate />
        )}
        <RankNotice />
        <Header discordAuth={discordAuth} session={session} linkedPlayer={linkedPlayer} />
        <main className="flex-1">{children}</main>
        <Footer />
        <XpBar />
        <DayNightScroll />
      </body>
    </html>
  );
}
