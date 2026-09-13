// Site-wide notice: ranks are cosmetic supporter tags except Gilded+ and Gilded++.
export default function RankNotice() {
  return (
    <div className="mc-alert">
      <p className="text-xs font-medium leading-relaxed text-amber-200 sm:text-sm">
        Only <span className="font-bold text-amber-300">Gilded+ &amp; Gilded++</span> have rank
        benefits — the rest are just for show / server support.
      </p>
    </div>
  );
}
