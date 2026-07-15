export type Platform = "java" | "bedrock";

const FLOODGATE_PREFIX = process.env.FLOODGATE_PREFIX ?? ".";

// Java usernames: 3-16 [A-Za-z0-9_]. Bedrock gamertags also allow spaces,
// which Floodgate replaces with underscores by default (replace-spaces: true).
// Everything else is stripped so a typo'd username can never smuggle extra
// command arguments into the console.
export function normalizeUsername(raw: string, platform: Platform): string {
  let name = raw.trim().replace(/[^A-Za-z0-9_ ]/g, "");

  // If the buyer typed the Floodgate prefix themselves, strip it — we add it back.
  while (name.startsWith(FLOODGATE_PREFIX)) name = name.slice(FLOODGATE_PREFIX.length);

  if (platform === "bedrock") {
    name = name.replace(/ /g, "_").slice(0, 16);
    return FLOODGATE_PREFIX + name;
  }
  return name.replace(/ /g, "").slice(0, 16);
}

// Template = one console command per line; blank lines ignored.
export function renderCommands(template: string, effectiveUsername: string): string[] {
  return template
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replaceAll("{username}", effectiveUsername));
}
