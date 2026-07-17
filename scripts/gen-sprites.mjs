// Compiles ASCII pixel maps into box-shadow pixel-art sprites (app/sprites.css).
// Edit the maps below, then run:  node scripts/gen-sprites.mjs
// '.' = transparent; every other char must exist in the sprite's palette.
import { writeFileSync } from "node:fs";

/* ── hand-drawn sprites ─────────────────────────────────────────────── */

// One shared villager pixel map; professions differ only by robe palette
// (skin/eyes/nose stay identical — recoloring the whole sprite with CSS
// filters turned the priest into a purple-faced blob).
const VILLAGER_MAP = [
  "..ssssssssss..",
  "..ssssssssss..",
  "..sHHHHHHHHs..",
  "..sees..sees..",
  "..ssssnnssss..",
  "..ssssnnssss..",
  "..ssssnnssss..",
  "..ssssSSssss..",
  "..rrrrrrrrrr..",
  "..rrrrrrrrrr..",
  "RRRRRRRRRRRRRR",
  "RRRRRRRRRRRRRR",
  "RRRRRRRRRRRRRR",
  "..rrrrddrrrr..",
  "..rrrrddrrrr..",
  "..rrrrddrrrr..",
  "..rrrrddrrrr..",
  "..rrrrddrrrr..",
  "..rrrrddrrrr..",
  "..rrrrddrrrr..",
  "..RRRRRRRRRR..",
  "..dd......dd..",
];

function makeVillager(robe) {
  return {
    px: 4,
    colors: {
      s: "#b08155", // skin
      S: "#96683f", // skin shade
      H: "#5e401f", // unibrow
      e: "#3d7a34", // eyes
      n: "#9a6b42", // nose
      r: robe.r, // robe
      R: robe.R, // robe dark (arms/hem)
      d: robe.d, // robe trim
    },
    map: VILLAGER_MAP,
  };
}

const villager = makeVillager({ r: "#55412f", R: "#453427", d: "#2f241a" }); // farmer brown
const villagerLibrarian = makeVillager({ r: "#c9c2b1", R: "#a49b88", d: "#6e6656" }); // white robe
const villagerPriest = makeVillager({ r: "#5d3a7a", R: "#482c60", d: "#301d42" }); // purple robe

const golem = {
  px: 4,
  colors: {
    i: "#b9b1a1", // iron light
    I: "#948c7c", // iron mid
    D: "#6e6759", // iron dark
    e: "#8a3324", // eyes
    v: "#4c6b2f", // vines
  },
  map: [
    "......iiiiiiii......",
    "......iiiiiiii......",
    "......iDDiiDDi......",
    "......ieiIIiei......",
    "......iiiIIiii......",
    "..II..iiiIIiii..II..",
    "..IIiiiiiiiiiiiiII..",
    "..IIiiiiiiiiiiiiII..",
    "..IIivviiiiiiiiiII..",
    "..IIiiiiiiiiiiiiII..",
    "..IIiiiiiiiivviiII..",
    "..IIiiiiiiiiiiiiII..",
    "..IIiiiiiiiiiiiiII..",
    "..II..iiiiiiii..II..",
    "..II..iiiiiiii..II..",
    "..DD..iiiiiiii..DD..",
    ".....IIII..IIII.....",
    ".....IIII..IIII.....",
    ".....IIII..IIII.....",
    ".....IIII..IIII.....",
    ".....IIII..IIII.....",
    ".....IIII..IIII.....",
    ".....IIII..IIII.....",
    ".....IIII..IIII.....",
    ".....DDDD..DDDD.....",
    ".....DDDD..DDDD.....",
  ],
};

// front-facing, symmetric, WITH arms: sleeves flank the torso and end in
// skin-colored hands, classic Steve proportions. The held emerald is a DOM
// overlay positioned over his right hand.
const steve = {
  px: 4,
  colors: {
    h: "#3a2a1e", // hair
    s: "#b57e56", // skin
    S: "#96683f", // mouth/nose shade
    p: "#4a3d8f", // eyes
    t: "#0e8a84", // shirt
    T: "#0b6f6a", // shirt shade (arm seam)
    l: "#39387f", // pants
    L: "#2d2c66", // pants split
    G: "#5f5f5f", // shoes
  },
  map: [
    "...hhhhhhhh...",
    "...hhhhhhhh...",
    "...hssssssh...",
    "...spssssps...",
    "...ssssssss...",
    "...sssSSsss...",
    "...ssSSSSss...",
    "...ssssssss...",
    ".TttttttttttT.",
    ".TttttttttttT.",
    ".TttttttttttT.",
    ".TttttttttttT.",
    ".TttttttttttT.",
    ".ss.tttttt.ss.",
    ".ss.tttttt.ss.",
    ".ss.tttttt.ss.",
    "...lllLLlll...",
    "...lllLLlll...",
    "...lllLLlll...",
    "...lllLLlll...",
    "...lllLLlll...",
    "...lllLLlll...",
    "...GGGGGGGG...",
    "...GGGGGGGG...",
  ],
};

const oak = {
  px: 4,
  colors: {
    k: "#1c4015", // leaves
    K: "#142e0e", // leaves dark
    g: "#265219", // leaves light
    b: "#3a2413", // bark
    B: "#241505", // bark dark
  },
  map: [
    ".....kkkkkkkk.....",
    "....kKkkkkkkKk....",
    "..kkkkKkkgkkkkkk..",
    "..kKkkkkkkkkKkkk..",
    "..kkkgkkKkkkkkgk..",
    "kkKkkkkkkkkkkKkkkk",
    "kkkkkgkkkkgkkkkkKk",
    "kKkkkkkkKkkkkkkkkk",
    "kkkkkkkkkkkkkgkkkk",
    ".kkkKkkkkkkkkkkkk.",
    ".kkkkkkgkkkKkkkkk.",
    "..kkkkkkkkkkkkkk..",
    "...kkkkkkkkkkk....",
    "....kkkkkkkkk.....",
    ".......bbbb.......",
    ".......bBbb.......",
    ".......bbbb.......",
    ".......bBbb.......",
    ".......bbbb.......",
    ".......bbBb.......",
    ".......bbbb.......",
    ".......bbbb.......",
  ],
};

const campfireLogs = {
  px: 4,
  colors: {
    l: "#4a2f16",
    L: "#332008",
    o: "#e07524", // coals
    O: "#8a3f12",
  },
  map: [
    "..ll........ll..",
    "...ll......ll...",
    "....llooooll....",
    "...LLooOOooLL...",
    "LLLLLLLLLLLLLLLL",
    ".LLLLLLLLLLLLLL.",
  ],
};

/* ── generated maps (house + farm are easier to build in code) ──────── */

function houseMap() {
  const W = 30;
  const H = 24;
  const rows = Array.from({ length: H }, () => Array(W).fill("."));
  // stepped spruce roof, rows 0-7
  for (let r = 0; r <= 7; r++) {
    const start = Math.max(0, 13 - r * 2);
    const end = Math.min(W - 1, 16 + r * 2);
    for (let c = start; c <= end; c++) {
      rows[r][c] = c === start || c === end || r === 0 ? "K" : "k";
    }
  }
  // plank walls with log corners, rows 8-21, cols 2-27
  for (let r = 8; r <= 21; r++) {
    for (let c = 2; c <= 27; c++) {
      const isLog = c <= 3 || c >= 26;
      if (isLog) rows[r][c] = [10, 14, 18].includes(r) ? "O" : "o";
      else rows[r][c] = [11, 15, 19].includes(r) ? "P" : "p";
    }
  }
  // windows (lit, wooden cross), rows 11-14
  for (const wx of [6, 20]) {
    for (let r = 11; r <= 14; r++) {
      for (let c = wx; c <= wx + 3; c++) {
        const border = r === 11 || r === 14 || c === wx || c === wx + 3;
        rows[r][c] = border ? "o" : r === 12 && false ? "o" : "y";
      }
    }
    rows[12][wx + 1] = "Y";
    rows[13][wx + 2] = "Y";
  }
  // dark-oak door, rows 15-21, cols 13-16
  for (let r = 15; r <= 21; r++) {
    for (let c = 13; c <= 16; c++) {
      rows[r][c] = c === 13 || c === 16 || r === 15 ? "D" : "d";
    }
  }
  rows[17][14] = "y"; // little door window
  // cobblestone foundation, rows 22-23
  for (let r = 22; r <= 23; r++) {
    for (let c = 1; c <= 28; c++) {
      rows[r][c] = (r * 7 + c * 3) % 4 === 0 ? "C" : "c";
    }
  }
  return rows.map((r) => r.join(""));
}

const house = {
  px: 6,
  colors: {
    k: "#241a10", // roof
    K: "#16100a", // roof edge
    p: "#5d4426", // planks
    P: "#4c3720", // plank seam
    o: "#3c2a16", // oak log
    O: "#2c1e0e", // log ring
    y: "#f4b453", // lit window
    Y: "#ffd98a", // window sparkle
    d: "#2e1d0d", // door
    D: "#1a0f05", // door frame
    c: "#565a5e", // cobble
    C: "#3f4347", // cobble dark
  },
  map: houseMap(),
};

function farmMap() {
  const W = 26;
  const H = 8;
  const rows = Array.from({ length: H }, () => Array(W).fill("."));
  // crops: wheat left of the water channel, carrots right
  for (let c = 1; c <= 10; c++) {
    const tall = c % 3 === 1;
    if (tall) rows[1][c] = "W";
    if (tall || c % 3 === 2) rows[2][c] = "W";
    rows[3][c] = c % 3 === 0 ? "w" : "W";
  }
  for (let c = 15; c <= 24; c++) {
    const tall = c % 3 === 0;
    if (tall) rows[2][c] = "x";
    rows[3][c] = tall || c % 3 === 1 ? "x" : "X";
  }
  // tilled soil + water channel
  for (let r = 4; r <= 5; r++) {
    for (let c = 0; c < W; c++) {
      rows[r][c] = c === 12 || c === 13 ? (r === 4 ? "Q" : "q") : "f";
    }
  }
  // log border
  for (let c = 0; c < W; c++) {
    rows[6][c] = "o";
    rows[7][c] = c % 5 === 2 ? "O" : "o";
  }
  return rows.map((r) => r.join(""));
}

const farm = {
  px: 6,
  colors: {
    W: "#b89b3a", // wheat
    w: "#8a7429", // wheat shade
    x: "#c06f2c", // carrot tops... orange tuft
    X: "#3f6b28", // carrot greens
    f: "#3b2712", // farmland
    q: "#2c4f8a", // water
    Q: "#4a74b8", // water glint
    o: "#3c2a16", // log border
    O: "#2c1e0e",
  },
  map: farmMap(),
};

/* ── compiler ───────────────────────────────────────────────────────── */

const sprites = {
  villager,
  "villager-librarian": villagerLibrarian,
  "villager-priest": villagerPriest,
  golem,
  steve,
  oak,
  house,
  farm,
  "campfire-logs": campfireLogs,
};

let css =
  "/* AUTO-GENERATED by scripts/gen-sprites.mjs — edit the pixel maps there,\n   then run `node scripts/gen-sprites.mjs`. Do not edit this file by hand. */\n";

for (const [name, s] of Object.entries(sprites)) {
  const width = s.map[0].length;
  s.map.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`${name} row ${y} is ${row.length} wide, expected ${width}`);
    }
    for (const ch of row) {
      if (ch !== "." && !s.colors[ch]) {
        throw new Error(`${name} row ${y}: unknown color char "${ch}"`);
      }
    }
  });

  const shadows = [];
  s.map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      shadows.push(`${x * s.px}px ${y * s.px}px ${s.colors[ch]}`);
    });
  });

  css += `.spr-${name}{position:relative;width:${width * s.px}px;height:${s.map.length * s.px}px;}\n`;
  css += `.spr-${name}::after{content:"";position:absolute;top:0;left:0;width:${s.px}px;height:${s.px}px;box-shadow:${shadows.join(",")};}\n`;
}

writeFileSync(new URL("../app/sprites.css", import.meta.url), css);
console.log(`sprites.css written (${Object.keys(sprites).length} sprites).`);
