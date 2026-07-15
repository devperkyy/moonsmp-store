import type { Metadata } from "next";
import { login } from "../actions";

export const metadata: Metadata = { title: "Admin login" };

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="mx-auto max-w-sm px-4 pt-28">
      <form
        action={login}
        className="rounded-2xl border border-night-600 bg-night-800/80 p-8 backdrop-blur"
      >
        <h1 className="text-xl font-black text-white">Admin</h1>
        {searchParams.error && (
          <p className="mt-3 rounded-md border border-red-800 bg-red-950/60 px-3 py-2 text-sm text-red-300">
            Wrong password.
          </p>
        )}
        <label className="mt-4 block text-sm font-medium text-slate-300">
          Password
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="mt-1 w-full rounded-lg border border-night-600 bg-night-900 px-3 py-2 text-white outline-none focus:border-moon-500"
          />
        </label>
        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-moon-500 py-2.5 font-bold text-night-950 transition hover:bg-moon-400"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
