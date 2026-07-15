import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Placeholder pricing (CAD cents) — edit in the admin panel later.
// Command templates are placeholders for the custom rank/crate systems:
// adjust the exact syntax at /admin/packages without touching code.
const packages = [
  {
    id: "star",
    name: "Star",
    description: "Entry rank — colored name, /hat, 2 extra homes.",
    category: "ranks",
    priceCents: 999,
    commandTemplate: "rank give {username} star",
    sortOrder: 1,
  },
  {
    id: "starstruck",
    name: "Starstruck",
    description: "Everything in Star, plus /fly in claims and 5 extra homes.",
    category: "ranks",
    priceCents: 1999,
    commandTemplate: "rank give {username} starstruck",
    sortOrder: 2,
  },
  {
    id: "moon-plus",
    name: "Moon+",
    description: "Premium rank — kits, particle trails, priority queue.",
    category: "ranks",
    priceCents: 3499,
    commandTemplate: "rank give {username} moonplus",
    sortOrder: 3,
  },
  {
    id: "asteroid",
    name: "Asteroid",
    description: "Top-tier rank — all perks, exclusive cosmetics and tag.",
    category: "ranks",
    priceCents: 5999,
    commandTemplate: "rank give {username} asteroid",
    sortOrder: 4,
  },
  {
    id: "vote-key",
    name: "Vote Key",
    description: "One key for the Vote Crate.",
    category: "crates",
    priceCents: 299,
    commandTemplate: "crate givekey {username} vote 1",
    sortOrder: 1,
  },
  {
    id: "donator-key",
    name: "Donator Key",
    description: "One key for the Donator Crate — rarer loot pool.",
    category: "crates",
    priceCents: 799,
    commandTemplate: "crate givekey {username} donator 1",
    sortOrder: 2,
  },
];

async function main() {
  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {}, // never clobber admin edits on re-seed
      create: pkg,
    });
  }
  console.log(`Seeded ${packages.length} packages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
