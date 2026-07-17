import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Placeholder pricing (CAD cents) — edit in the admin panel later.
// Rank command syntax is confirmed live on the server: `setrank <player> <rank>`.
const packages = [
  {
    id: "star",
    name: "Star",
    description: "Cosmetic rank tag — pure server support, no gameplay perks.",
    category: "ranks",
    priceCents: 299,
    commandTemplate: "setrank {username} star",
    sortOrder: 1,
  },
  {
    id: "starstruck",
    name: "Starstruck",
    description: "Cosmetic rank tag — pure server support, no gameplay perks.",
    category: "ranks",
    priceCents: 399,
    commandTemplate: "setrank {username} starstruck",
    sortOrder: 2,
  },
  {
    id: "meteorite",
    name: "Meteorite",
    description: "Cosmetic rank tag — pure server support, no gameplay perks.",
    category: "ranks",
    priceCents: 499,
    commandTemplate: "setrank {username} meteorite",
    sortOrder: 3,
  },
  {
    id: "asteroid",
    name: "Asteroid",
    description: "Cosmetic rank tag — pure server support, no gameplay perks.",
    category: "ranks",
    priceCents: 599,
    commandTemplate: "setrank {username} asteroid",
    sortOrder: 4,
  },
  {
    id: "moon-plus",
    name: "Moon+",
    description: "The only rank with real benefits — perks and kits on top of the tag.",
    category: "ranks",
    priceCents: 699,
    commandTemplate: "setrank {username} moon+",
    sortOrder: 5,
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
