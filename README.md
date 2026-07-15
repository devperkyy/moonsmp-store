# Moon SMP Store

Custom webstore for Moon SMP (Paper 1.21 + Geyser/Floodgate), replacing CraftingStore/Tebex.
Next.js 14 App Router · Tailwind · Prisma/Postgres · Stripe Checkout (CAD) · queue-based
in-game delivery via the bundled **MoonDeliveries** Paper plugin.

## How delivery works

```
Buyer → Stripe Checkout (username + edition collected there)
      → webhook: checkout.session.completed
      → Order + Delivery rows written to Postgres (status: pending)
      → MoonDeliveries plugin polls GET /api/plugin/deliveries every 10s
      → runs each command in console, POSTs success/fail back
      → every attempt is logged (DeliveryAttempt) for "I paid but got nothing" tickets
```

**Why polling instead of RCON:** the store never needs to reach your Minecraft server.
If the server is offline/restarting when someone pays, the delivery just waits in the
queue and lands on the next poll after boot. No RCON port exposed to the internet, no
RCON password in Vercel. Tradeoff: up to `poll-seconds` of delay (default 10s).
Deliveries are at-least-once: if the plugin executes a command but crashes before
reporting back, the row is re-offered after 5 minutes.

## Setup

### 1. Install & database

```bash
npm install
copy .env.example .env
```

**Quick local start (no Postgres needed):**

```bash
npm run db:local   # switches Prisma to a local SQLite file, creates tables, seeds packages
npm run dev        # http://localhost:3000
```

Keep `DATABASE_URL="file:./dev.db"` in `.env` for this mode. `npm run build` (and
therefore every Vercel deploy) automatically switches the schema back to Postgres, so
the SQLite dev setup can't leak into production. After running a local `build`, run
`npm run db:local` again to restore dev mode.

**Production database:** create a free Postgres DB at https://neon.tech (or Vercel →
Storage → Postgres), put its connection string in `DATABASE_URL`, then:

```bash
node scripts/set-db.mjs postgres
npm run db:push   # create tables
npm run db:seed   # insert the 6 packages (placeholder prices)
```

### 2. Stripe (test mode first)

1. https://dashboard.stripe.com → **Developers → API keys** → copy the *secret* key
   (`sk_test_…`) into `STRIPE_SECRET_KEY`.
2. Local webhook testing: install the Stripe CLI, then
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET` and restart `npm run dev`.
3. Buy something with test card `4242 4242 4242 4242` — the order should appear at
   `/admin` with a `pending` delivery.

Production: **Developers → Webhooks → Add endpoint** →
`https://store.moonsmp.org/api/stripe/webhook`, event `checkout.session.completed`,
and use that endpoint's signing secret + your live `sk_live_…` key in Vercel env vars.

### 3. Admin panel

Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (any long random string) in `.env`.
Visit `/admin` — orders + delivery log + retry buttons; `/admin/packages` edits names,
prices, and command templates live (one console command per line, `{username}`
placeholder).

### 4. Paper plugin

```bash
cd paper-plugin
mvn package        # → target/MoonDeliveries.jar
```

Drop the jar in `plugins/`, restart once, then edit `plugins/MoonDeliveries/config.yml`:

```yaml
api-url: "https://store.moonsmp.org"
api-key: "<same value as PLUGIN_API_KEY in Vercel>"
poll-seconds: 10
```

Generate the shared key with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and restart.

### 5. Bedrock / Floodgate

Buyers pick **Java** or **Bedrock** at checkout. Bedrock usernames get spaces converted
to `_` and the Floodgate prefix prepended (default `.`, override with
`FLOODGATE_PREFIX` if you changed `username-prefix` in Floodgate's config). Commands
like `lp user .PlayerName parent add star` work as long as the player has joined at
least once.

### 6. Deploy to Vercel

1. Push this repo to GitHub, import it in Vercel.
2. Set every variable from `.env.example` in **Project → Settings → Environment
   Variables** (`NEXT_PUBLIC_SITE_URL=https://store.moonsmp.org`).
3. **Project → Settings → Domains** → add `store.moonsmp.org`, point your DNS CNAME at
   `cname.vercel-dns.com`.
4. Run `npm run db:push && npm run db:seed` once against the production `DATABASE_URL`.

### Branding & background

- `public/branding/logo.png` — header logo
- `public/branding/banner.png` — home hero banner
- `public/packages/<id>.png` — package art shown on cards + detail pages
  (`star.png`, `starstruck.png`, `moon-plus.png`, `asteroid.png`, `vote-key.png`,
  `donator-key.png`); a gradient icon tile renders until a file exists.
- `public/background/campfire.mp4` — optional looping night-village video (Higgsfield);
  until it exists, the built-in CSS pixel campfire scene renders instead.

## Detail pages

Every package has a page at `/package/<id>` with its art, average star rating,
creation date, purchase count, quantity options (1x / 3x / 5x — the delivery command
runs once per unit), and buyer reviews (name + stars + comment, no login required).

## Command template examples

```
lp user {username} parent add starstruck
crazycrates give physical vote 1 {username}
eco give {username} 5000
broadcast &b{username} &fjust bought &dMoon+&f — thank you!
```
