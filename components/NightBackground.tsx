// Full-page animated Minecraft scene. Every mob and building is real pixel
// art: hand-drawn maps in scripts/gen-sprites.mjs compiled to box-shadow
// sprites (app/sprites.css). Layout/animation lives in globals.css.
// DayNightScroll ties the sun/moon and overall lighting to scroll
// position. When a Higgsfield loop lands in public/background/campfire.mp4
// the <video> layer takes over.
import { terrainClipPath } from "@/lib/terrain";

// Height profiles (0 = ground, 1 = full band height) with real valleys
// dipping toward the ground — without dips it renders as one solid slab.
const FAR_RIDGE = [0.2, 0.45, 0.7, 0.5, 0.15, 0.35, 0.65, 0.85, 0.6, 0.3, 0.5, 0.75, 0.4, 0.1];
const NEAR_RIDGE = [0.35, 0.15, 0.6, 0.4, 0.75, 0.5, 0.2, 0.55, 0.85, 0.45, 0.1, 0.3];

// `.scene-item` (position:absolute, pinned via left/right/bottom) and every
// `.spr-*` sprite class (position:relative, needed so its pixel-art
// pseudo-element and any child overlays anchor correctly) must live on
// *separate* elements. Combining them on one <div> lets CSS source order
// decide which `position` wins — sprites.css loads after globals.css, so
// `relative` silently clobbers `absolute` and the element falls into normal
// document flow (this caused floating/misplaced sprites once already).
function Placed({
  positionStyle,
  spriteClass,
  spriteStyle,
  children,
}: {
  positionStyle: React.CSSProperties;
  spriteClass: string;
  spriteStyle?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div className="scene-item" style={positionStyle}>
      <div className={spriteClass} style={spriteStyle}>
        {children}
      </div>
    </div>
  );
}

// each profession is its own generated sprite with a different robe palette
// (skin identical) — see makeVillager in scripts/gen-sprites.mjs
type Profession = "farmer" | "librarian" | "priest";
const PROFESSION_SPRITE: Record<Profession, string> = {
  farmer: "spr-villager",
  librarian: "spr-villager-librarian",
  priest: "spr-villager-priest",
};

function Villager({
  style,
  profession = "farmer",
  bubble,
  curious,
  late,
  flip,
}: {
  style: React.CSSProperties;
  profession?: Profession;
  bubble?: boolean; // trades an emerald with the other gossiping villager
  curious?: boolean; // "?" bubble — reacting to something nearby (e.g. Steve's find)
  late?: boolean;
  flip?: boolean;
}) {
  const spriteClass = `${PROFESSION_SPRITE[profession]} v-anim`;
  return (
    <Placed positionStyle={style} spriteClass={spriteClass} spriteStyle={flip ? { scale: "-1 1" } : undefined}>
      {bubble && (
        <div className={`v-bubble ${late ? "v-bubble-late" : ""}`}>
          <span className="emerald" />
        </div>
      )}
      {curious && (
        <div className="v-bubble">
          <span className="curious-mark">?</span>
        </div>
      )}
    </Placed>
  );
}

// window glow positions match the lit panes baked into the house sprite
function House({ style, scale = 1 }: { style: React.CSSProperties; scale?: number }) {
  return (
    <Placed positionStyle={style} spriteClass="spr-house" spriteStyle={{ zoom: scale }}>
      <div className="house-glow" style={{ left: "34px", top: "64px" }} />
      <div className="house-glow" style={{ left: "118px", top: "64px", animationDelay: "1.6s" }} />
    </Placed>
  );
}

function Tree({ style, zoom }: { style: React.CSSProperties; zoom?: number }) {
  return <Placed positionStyle={style} spriteClass="spr-oak" spriteStyle={zoom ? { zoom } : undefined} />;
}

function Golem({
  style,
  spot,
  animationDelay,
}: {
  style: React.CSSProperties;
  spot?: boolean;
  animationDelay?: string;
}) {
  return (
    <div className={`scene-item ${spot ? "golem-spot" : ""}`} style={style}>
      <div className="spr-golem" style={animationDelay ? { animationDelay } : undefined} />
    </div>
  );
}

// Standing, holding a single emerald up — no chopping, no tree needed.
function SteveRig({ style }: { style: React.CSSProperties }) {
  return (
    <div className="steve-rig" style={style}>
      <div className="spr-steve" />
      <span className="steve-emerald emerald" />
    </div>
  );
}

export default function NightBackground() {
  const embers = [
    { left: "-14px", drift: "-26px", delay: "0s" },
    { left: "-4px", drift: "10px", delay: "0.9s" },
    { left: "6px", drift: "-12px", delay: "1.7s" },
    { left: "12px", drift: "24px", delay: "2.3s" },
    { left: "0px", drift: "-20px", delay: "2.9s" },
  ];

  return (
    <div className="night-scene" aria-hidden="true">
      {/* day sky fades out as the page scrolls toward "night" (DayNightScroll) */}
      <div className="day-sky" />

      <div className="stars" />
      <div className="stars stars-2" />
      <div className="pixel-sun" />
      <div className="pixel-moon" />

      {/* blocky stepped terrain on the horizon, sitting behind the village
          as a backdrop rather than overlapping it */}
      <div
        className="mc-mountains mc-mountains-far"
        style={{ clipPath: terrainClipPath(FAR_RIDGE) }}
      />
      <div
        className="mc-mountains mc-mountains-near"
        style={{ clipPath: terrainClipPath(NEAR_RIDGE) }}
      />

      {/* forest — kept sparse; one tree survives on mobile */}
      <Tree style={{ left: "6vw" }} />
      <div className="wide-deco">
        <Tree style={{ left: "35vw" }} zoom={0.75} />
        <Tree style={{ left: "63vw" }} zoom={0.85} />
        <Tree style={{ left: "92vw" }} zoom={0.7} />
      </div>

      {/* houses */}
      <House style={{ left: "3vw" }} />
      <House style={{ right: "4vw" }} />
      <div className="wide-deco">
        <House style={{ left: "42vw" }} scale={0.75} />
      </div>

      <div className="night-ground" />

      {/* ravine cutting through the ground, lava glowing at the bottom */}
      <div className="wide-deco">
        <div className="ravine" style={{ left: "58vw" }} />
      </div>

      {/* crop farm with a water channel */}
      <div className="wide-deco">
        <Placed positionStyle={{ right: "16vw", bottom: "12.2vh" }} spriteClass="spr-farm" />
      </div>

      {/* villagers — the two gossiping traders always show, spread wide so
          they don't crowd the center */}
      <Villager style={{ left: "18vw" }} profession="farmer" bubble />
      <Villager style={{ right: "14vw" }} profession="librarian" bubble late flip />
      <div className="wide-deco">
        <Villager style={{ left: "30vw" }} profession="farmer" />
        <Villager style={{ left: "46vw" }} profession="priest" curious flip />
      </div>

      {/* iron golems on patrol, spread to opposite edges */}
      <Golem style={{ left: "76vw" }} spot />
      <div className="wide-deco">
        <Golem style={{ left: "12vw" }} animationDelay="2.5s" />
      </div>

      {/* Steve, showing off an emerald he found */}
      <div className="wide-deco">
        <SteveRig style={{ left: "52vw" }} />
      </div>

      <div className="campfire">
        <div className="campfire-glow" />
        <div
          className="spr-campfire-logs"
          style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)" }}
        />
        <div className="flame" />
        <div className="flame flame-inner" />
        <div className="flame flame-core" />
        {embers.map((e, i) => (
          <div
            key={i}
            className="ember"
            style={{ left: `calc(50% + ${e.left})`, animationDelay: e.delay, ["--drift" as string]: e.drift }}
          />
        ))}
      </div>

      {/* Higgsfield loop drops in here once generated */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        autoPlay
        loop
        muted
        playsInline
        src="/background/campfire.mp4"
      />

      {/* darkening overlay so cards/text stay readable — lighter at the
          bottom so the village stays visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/25" />
    </div>
  );
}
