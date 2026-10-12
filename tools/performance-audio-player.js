// Preserve the existing player/controls; allocate the stream only on real input.
function usePortfolioBgmPlayer(mounted, playerRef, enabledRef, setReady) {
  i.useEffect(() => {
    if (!mounted) return;
    setReady(false);
    const player = new Audio();
    player.preload = "none"; player.loop = true; player.volume = .35;
    player.src = `${location.origin}/bgm.mp3`;
    playerRef.current = player;
    let requested = false, disposed = false, timer = 0;
    const cleanEvents = () => {
      player.removeEventListener("canplaythrough", ready);
      player.removeEventListener("loadeddata", loaded);
      player.removeEventListener("error", failed);
    };
    const ready = () => {
      if (disposed) return;
      clearTimeout(timer); cleanEvents(); setReady(true);
    };
    const loaded = () => { if (player.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) ready(); };
    const failed = () => {
      if (disposed) return;
      clearTimeout(timer); cleanEvents(); setReady(false);
      console.warn("Failed to load BGM");
    };
    const start = () => {
      if (disposed || requested || !enabledRef.current) return;
      requested = true; player.preload = "auto";
      player.addEventListener("canplaythrough", ready);
      player.addEventListener("loadeddata", loaded);
      player.addEventListener("error", failed);
      timer = setTimeout(failed, 45000);
      player.load();
      // Queue playback during the gesture, including mobile user-activation rules.
      player.play().catch(() => {});
    };
    document.addEventListener("pointerdown", start, { passive: true });
    window.addEventListener("portfolio:sound-intent", start);
    return () => {
      disposed = true; clearTimeout(timer); cleanEvents();
      document.removeEventListener("pointerdown", start);
      window.removeEventListener("portfolio:sound-intent", start);
      if (playerRef.current === player) playerRef.current = null;
      player.pause(); player.removeAttribute("src"); player.load();
    };
  }, [mounted, playerRef, enabledRef, setReady]);
}
