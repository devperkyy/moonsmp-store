// Full-page animated pixel village at night, drawn entirely in CSS:
// blocky mountain terrain, oak trees, plank houses with flickering windows,
// villagers bobbing and "talking" (alternating emerald chat bubbles), iron
// golems on patrol, Steve chopping a tree, and the campfire.
// When a Higgsfield loop lands in public/background/campfire.mp4, the
// <video> layer takes over (a missing file renders nothing, so the CSS
// scene shows through).

function House({
  style,
  windows,
  doorLeft,
}: {
  style: React.CSSProperties;
  windows: { left: string; top: string; delay?: string }[];
  doorLeft: string;
}) {
  return (
    <div className="mc-house" style={style}>
      <div className="mc-roof mc-roof-1" />
      <div className="mc-roof mc-roof-2" />
      <div className="mc-roof mc-roof-3" />
      <div className="mc-door" style={{ left: doorLeft }} />
      {windows.map((w, i) => (
        <div
          key={i}
          className="house-window"
          style={{ left: w.left, top: w.top, animationDelay: w.delay }}
        />
      ))}
    </div>
  );
}

function Villager({
  style,
  bubble,
  late,
}: {
  style: React.CSSProperties;
  bubble?: boolean;
  late?: boolean;
}) {
  return (
    <div className="villager" style={style}>
      {bubble && (
        <div className={`v-bubble ${late ? "v-bubble-late" : ""}`}>
          <span className="emerald" />
        </div>
      )}
      <div className="v-head" />
      <div className="v-body" />
    </div>
  );
}

function Tree({ style, small }: { style: React.CSSProperties; small?: boolean }) {
  return (
    <div className={`mc-tree ${small ? "mc-tree-sm" : ""}`} style={style}>
      <div className="tree-trunk" />
      <div className="tree-leaves" />
    </div>
  );
}

function Golem({ style }: { style: React.CSSProperties }) {
  return (
    <div className="golem" style={style}>
      <div className="g-head" />
      <div className="g-arm g-arm-l" />
      <div className="g-arm g-arm-r" />
      <div className="g-body" />
      <div className="g-legs" />
    </div>
  );
}

function Steve({ style }: { style: React.CSSProperties }) {
  return (
    <div className="steve" style={style}>
      <div className="s-head" />
      <div className="s-body" />
      <div className="s-legs" />
      <div className="s-arm" />
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

      {/* rough terrain on the horizon */}
      <div className="mc-mountains mc-mountains-far" />
      <div className="mc-mountains mc-mountains-near" />

      {/* forest */}
      <Tree style={{ left: "17vw" }} />
      <Tree style={{ left: "23vw" }} small />
      <Tree style={{ left: "45vw" }} small />
      <Tree style={{ left: "78vw" }} />
      <Tree style={{ left: "93vw" }} small />

      {/* village houses */}
      <House
        style={{ left: "4vw" }}
        doorLeft="22px"
        windows={[
          { left: "72px", top: "34px" },
          { left: "122px", top: "34px", delay: "1.4s" },
        ]}
      />
      <House
        style={{ left: "27vw", width: "132px", height: "90px" }}
        doorLeft="14px"
        windows={[{ left: "78px", top: "30px", delay: "2.1s" }]}
      />
      <House
        style={{ right: "4vw" }}
        doorLeft="112px"
        windows={[
          { left: "26px", top: "34px", delay: "0.7s" },
          { left: "70px", top: "34px", delay: "2.6s" },
        ]}
      />
      <House
        style={{ right: "22vw", width: "124px", height: "86px" }}
        doorLeft="76px"
        windows={[{ left: "22px", top: "28px", delay: "1.8s" }]}
      />

      <div className="night-ground" />

      {/* villagers — two trading gossip by the fire, the rest wandering */}
      <Villager style={{ left: "12vw" }} />
      <Villager style={{ left: "33vw" }} bubble />
      <Villager style={{ left: "41vw" }} />
      <Villager style={{ left: "59vw", transform: "scaleX(-1)" }} bubble late />
      <Villager style={{ left: "70vw", transform: "scaleX(-1)" }} />

      {/* iron golems on patrol */}
      <Golem style={{ left: "20vw" }} />
      <Golem style={{ left: "86vw", animationDelay: "2.5s" }} />

      {/* Steve getting wood */}
      <Steve style={{ left: "75vw" }} />

      <div className="campfire">
        <div className="campfire-glow" />
        <div className="campfire-logs" />
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
