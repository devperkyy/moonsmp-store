// Full-page animated Minecraft night scene. Every mob and building is real
// pixel art: hand-drawn maps in scripts/gen-sprites.mjs compiled to
// box-shadow sprites (app/sprites.css). Layout/animation lives in
// globals.css. When a Higgsfield loop lands in public/background/campfire.mp4
// the <video> layer takes over.

function Villager({
  style,
  bubble,
  late,
  flip,
}: {
  style: React.CSSProperties;
  bubble?: boolean;
  late?: boolean;
  flip?: boolean;
}) {
  return (
    <div className="scene-item" style={style}>
      <div className="spr-villager" style={flip ? { scale: "-1 1" } : undefined}>
        {bubble && (
          <div className={`v-bubble ${late ? "v-bubble-late" : ""}`}>
            <span className="emerald" />
          </div>
        )}
      </div>
    </div>
  );
}

// window glow positions match the lit panes baked into the house sprite
function House({ style, scale = 1 }: { style: React.CSSProperties; scale?: number }) {
  return (
    <div className="scene-item spr-house" style={{ ...style, zoom: scale }}>
      <div className="house-glow" style={{ left: "34px", top: "64px" }} />
      <div className="house-glow" style={{ left: "118px", top: "64px", animationDelay: "1.6s" }} />
    </div>
  );
}

function SteveRig({ style }: { style: React.CSSProperties }) {
  return (
    <div className="steve-rig" style={style}>
      <div className="spr-steve" />
      <div className="spr-steve-arm" />
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
      <div className="stars" />
      <div className="stars stars-2" />
      <div className="pixel-moon" />

      {/* blocky terrain on the horizon, snow on the far peaks */}
      <div className="mc-mountains mc-mountains-far" />
      <div className="mc-mountains mc-mountains-near" />

      {/* forest — one tree survives on mobile */}
      <div className="scene-item spr-oak" style={{ left: "8vw" }} />
      <div className="wide-deco">
        <div className="scene-item spr-oak" style={{ left: "21vw", zoom: 0.8 }} />
        <div className="scene-item spr-oak" style={{ left: "36vw", zoom: 0.7 }} />
        <div className="scene-item spr-oak" style={{ left: "67vw", zoom: 0.85 }} />
        <div className="scene-item spr-oak" style={{ left: "88vw" }} />
        <div className="scene-item spr-oak" style={{ left: "94vw", zoom: 0.7 }} />
      </div>

      {/* houses */}
      <House style={{ left: "4vw" }} />
      <div className="wide-deco">
        <House style={{ left: "26vw" }} scale={0.75} />
        <House style={{ right: "3vw" }} scale={0.9} />
      </div>

      <div className="night-ground" />

      {/* ravine cutting through the ground, lava glowing at the bottom */}
      <div className="wide-deco">
        <div className="ravine" style={{ left: "58vw" }} />
      </div>

      {/* crop farm with a water channel */}
      <div className="wide-deco">
        <div className="scene-item spr-farm" style={{ right: "13vw", bottom: "12.2vh" }} />
      </div>

      {/* villagers — the two gossiping traders always show */}
      <Villager style={{ left: "42vw" }} bubble />
      <Villager style={{ left: "55vw" }} bubble late flip />
      <div className="wide-deco">
        <Villager style={{ left: "13vw" }} />
        <Villager style={{ left: "30vw" }} flip />
        <Villager style={{ right: "9vw" }} />
      </div>

      {/* iron golems on patrol */}
      <div className="scene-item spr-golem golem-spot" style={{ left: "76vw" }} />
      <div className="wide-deco">
        <div className="scene-item spr-golem" style={{ left: "17.5vw", animationDelay: "2.5s" }} />
      </div>

      {/* Steve getting wood (tree at 67vw, axe swings into its trunk) */}
      <div className="wide-deco">
        <SteveRig style={{ left: "64.5vw" }} />
      </div>

      <div className="campfire">
        <div className="campfire-glow" />
        <div className="spr-campfire-logs" style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)" }} />
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
