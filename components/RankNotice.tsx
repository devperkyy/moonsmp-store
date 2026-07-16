// Site-wide red banner: ranks are cosmetic supporter tags except Moon+.
export default function RankNotice() {
  return (
    <div className="mc-alert">
      <p className="mc-text-shadow font-pixel text-[9px] leading-relaxed text-white sm:text-[10px]">
        ⚠ ONLY <span className="text-amber-300">MOON+</span> HAS RANK BENEFITS — THE REST
        ARE JUST FOR SHOW / SERVER SUPPORT ⚠
      </p>
    </div>
  );
}
