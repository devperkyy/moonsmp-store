// No stripe.js on this site — checkout redirects to Stripe's hosted page
// (session.url), so script-src doesn't need js.stripe.com. Images do come
// from Minecraft/Discord/GeyserMC CDNs (skins + avatars), hence img-src.
// 'unsafe-eval' is dev-only — Next's Fast Refresh evaluates code via eval(),
// which a production CSP has no reason to allow.
const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://textures.minecraft.net https://cdn.discordapp.com https://api.geysermc.org",
  "font-src 'self' data:",
  "connect-src 'self' https://discord.com https://api.geysermc.org",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
