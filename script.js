const menuButton=document.querySelector(".menu-toggle");const nav=document.querySelector(".main-nav");menuButton?.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open));menuButton.textContent=open?"✕":"☰";});document.querySelectorAll(".main-nav a").forEach(a=>a.addEventListener("click",()=>nav?.classList.remove("open")));const lb=document.getElementById("lightbox"),img=lb?.querySelector("img"),close=lb?.querySelector(".lightbox-close");document.querySelectorAll(".photo-card").forEach(c=>c.addEventListener("click",()=>{if(!lb||!img)return;img.src=c.dataset.full;lb.classList.add("open");document.body.style.overflow="hidden";}));function closeLb(){if(!lb||!img)return;lb.classList.remove("open");img.src="";document.body.style.overflow="";}close?.addEventListener("click",closeLb);lb?.addEventListener("click",e=>{if(e.target===lb)closeLb();});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeLb();});
/* ===== VRSA v30: autoplay + persistencia por sección + reinicio al cambiar FF.EE./general ===== */
(() => {
  const onSpecialForces = /(?:^|\/)fuerzas-especiales\.html(?:$|[?#])/.test(location.pathname + location.search + location.hash);
  const TRACK = onSpecialForces
    ? { id: "ffee", src: "musica-fuerzas-especiales.mp3", title: "Military" }
    : { id: "general", src: "musica-vrsa.mp3", title: "Military - War Military" };

  const KEY_TIME = `vrsa_music_time_${TRACK.id}`;
  const KEY_PLAYING = "vrsa_music_playing";
  const KEY_VOLUME = "vrsa_music_volume";
  const KEY_LAST_TRACK = "vrsa_music_last_track";
  const previousTrack = localStorage.getItem(KEY_LAST_TRACK);
  const switchedTrack = Boolean(previousTrack && previousTrack !== TRACK.id);
  localStorage.setItem(KEY_LAST_TRACK, TRACK.id);
  if (switchedTrack) localStorage.setItem(KEY_TIME, "0");

  const audio = document.createElement("audio");
  audio.id = "vrsa-music";
  audio.src = TRACK.src;
  audio.preload = "auto";
  audio.loop = true;
  audio.autoplay = true;

  const savedVolume = Number(localStorage.getItem(KEY_VOLUME));
  audio.volume = Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1 ? savedVolume : 0.28;

  const player = document.createElement("div");
  player.className = "vrsa-music-player";
  player.innerHTML = `
    <button class="vrsa-music-toggle" type="button" aria-label="Reproducir música" title="Música VRSA">
      <span class="vrsa-music-icon">▶</span>
      <span class="vrsa-music-label">Música</span>
    </button>
    <div class="vrsa-music-controls">
      <span class="vrsa-music-title">${TRACK.title}</span>
      <input class="vrsa-music-volume" type="range" min="0" max="1" step="0.05" aria-label="Volumen de la música">
    </div>`;

  document.body.appendChild(audio);
  document.body.appendChild(player);

  const toggle = player.querySelector(".vrsa-music-toggle");
  const icon = player.querySelector(".vrsa-music-icon");
  const volume = player.querySelector(".vrsa-music-volume");
  volume.value = String(audio.volume);

  const setVisualState = () => {
    const isPlaying = !audio.paused;
    icon.textContent = isPlaying ? "❚❚" : "▶";
    toggle.setAttribute("aria-label", isPlaying ? "Pausar música" : "Reproducir música");
    player.classList.toggle("is-playing", isPlaying);
  };

  const saveState = () => {
    if (Number.isFinite(audio.currentTime)) localStorage.setItem(KEY_TIME, String(audio.currentTime));
    localStorage.setItem(KEY_PLAYING, audio.paused ? "0" : "1");
    localStorage.setItem(KEY_VOLUME, String(audio.volume));
  };

  let autoplayBlocked = false;

  const tryAutoplay = () => {
    audio.play().then(() => {
      autoplayBlocked = false;
      localStorage.setItem(KEY_PLAYING, "1");
      setVisualState();
    }).catch(() => {
      autoplayBlocked = true;
      setVisualState();
    });
  };

  audio.addEventListener("loadedmetadata", () => {
    if (switchedTrack) {
      audio.currentTime = 0;
    } else {
      const savedTime = Number(localStorage.getItem(KEY_TIME));
      if (Number.isFinite(savedTime) && savedTime > 0) {
        audio.currentTime = Math.min(savedTime, Math.max(0, audio.duration - 0.25));
      }
    }
    tryAutoplay();
  });

  // Si el navegador bloquea el sonido automático, la primera interacción
  // del usuario habilita la música sin tener que tocar el botón del reproductor.
  const unlockAutoplay = () => {
    if (!autoplayBlocked || !audio.paused) return;
    tryAutoplay();
  };
  ["pointerdown", "touchstart", "keydown", "scroll"].forEach(evt => {
    window.addEventListener(evt, unlockAutoplay, { once: true, passive: true });
  });

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().then(() => {
        localStorage.setItem(KEY_PLAYING, "1");
        setVisualState();
      }).catch(setVisualState);
    } else {
      audio.pause();
      localStorage.setItem(KEY_PLAYING, "0");
      saveState();
      setVisualState();
    }
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    localStorage.setItem(KEY_VOLUME, String(audio.volume));
  });

  audio.addEventListener("play", setVisualState);
  audio.addEventListener("pause", setVisualState);
  audio.addEventListener("timeupdate", () => localStorage.setItem(KEY_TIME, String(audio.currentTime)));

  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener("click", saveState, { capture: true });
  });
  window.addEventListener("pagehide", saveState);
  window.addEventListener("beforeunload", saveState);
})();
