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
    id: "moon-plus-plus",
    name: "Moon++",
    description: "The highest cosmetic supporter tag — above Moon+, with no extra gameplay perks.",
    category: "ranks",
    priceCents: 899,
    commandTemplate: "setrank {username} moon++",
    sortOrder: 6,
  },
  // Crate command syntax confirmed from the compiled plugin (Crates.class):
  // "Usage: /crate key add <cratename> <player> <amount>" — note cratename
  // comes BEFORE player, opposite order from the rank command.
  {
    id: "diamond-crate",
    name: "Diamond Crate",
    description: "One key for the Diamond Crate.",
    category: "crates",
    priceCents: 199,
    commandTemplate: "crate key add Diamond {username} 1",
    sortOrder: 1,
  },
  {
    id: "money-crate",
    name: "Money Crate",
    description: "One key for the Money Crate.",
    category: "crates",
    priceCents: 299,
    commandTemplate: "crate key add Money {username} 1",
    sortOrder: 2,
  },
  {
    id: "spawner-crate",
    name: "Spawner Crate",
    description: "One key for the Spawner Crate.",
    category: "crates",
    priceCents: 499,
    commandTemplate: "crate key add Spawner {username} 1",
    sortOrder: 3,
  },
  {
    id: "crimson-crate",
    name: "Crimson Crate",
    description: "One key for the Crimson Crate.",
    category: "crates",
    priceCents: 699,
    commandTemplate: "crate key add Crimson {username} 1",
    sortOrder: 4,
  },
  {
    id: "moon-crate",
    name: "Moon Crate",
    description: "One key for the Moon Crate — the top tier.",
    category: "crates",
    priceCents: 999,
    commandTemplate: "crate key add Moon {username} 1",
    sortOrder: 5,
  },
];

// Old 2-tier placeholder crates — deactivated, not deleted, in case any
// order already references them.
const retiredPackageIds = ["vote-key", "donator-key"];

async function main() {
  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {}, // never clobber admin edits on re-seed
      create: pkg,
    });
  }
  for (const id of retiredPackageIds) {
    await prisma.package
      .update({ where: { id }, data: { active: false } })
      .catch(() => {}); // fine if it was never created
  }
  console.log(`Seeded ${packages.length} packages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
