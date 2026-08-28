import type { Metadata } from "next";
import Link from "next/link";
import { getMaintenanceState } from "@/lib/maintenance";
import { setMaintenanceMode } from "../actions";

export const metadata: Metadata = { title: "Admin · Maintenance" };
export const dynamic = "force-dynamic";

export default async function AdminMaintenancePage() {
  const state = await getMaintenanceState();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-14">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white">Maintenance</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-moon-500/60"
          >
            ← Orders
          </Link>
          <Link
            href="/admin/packages"
            className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-moon-500/60"
          >
            Packages
          </Link>
          <Link
            href="/admin/audit"
            className="rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-moon-500/60"
          >
            Audit log
          </Link>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Turning this on shows every visitor a &quot;store is in maintenance&quot; page instead of
        the site — including you, unless your Discord username is on the allowlist below. You can
        always get back in through <code className="rounded bg-night-800 px-1">/admin</code>,
        which stays reachable regardless.
      </p>

      <form
        action={setMaintenanceMode}
        className="mt-8 space-y-6 rounded-xl border border-night-600 bg-night-800/80 p-6 backdrop-blur"
      >
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-200">
          <input
            name="enabled"
            type="checkbox"
            defaultChecked={state.enabled}
            className="h-5 w-5 accent-moon-500"
          />
          Maintenance mode is {state.enabled ? "ON" : "OFF"}
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Message shown to visitors
          <textarea
            name="message"
            rows={3}
            defaultValue={state.message}
            placeholder="We're making some upgrades. Check back shortly!"
            className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
          />
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Allowlist — Discord usernames who can still use the site, one per line
          <textarea
            name="allowlist"
            rows={5}
            defaultValue={state.allowlist.join("\n")}
            placeholder={"devperkyy\nsomeoneelse"}
            className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-moon-500"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Not case-sensitive. Only applies when Discord sign-in is active — the legacy
            username gate has no identity to check an allowlist against.
          </span>
        </label>

        <button className="rounded-lg bg-moon-500 px-5 py-2 text-sm font-bold text-night-950 transition hover:bg-moon-400">
          Save
        </button>
      </form>
    </div>
  );
}
