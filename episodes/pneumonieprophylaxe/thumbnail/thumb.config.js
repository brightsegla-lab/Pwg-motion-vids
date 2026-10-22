// Per-episode thumbnail content. Values for Sturzprophylaxe shown as the reference.
window.THUMB = {
  chip: "Prophylaxen-Reihe",
  headline: "«THEMA»",          // ≤ 1–2 words, e.g. "STURZ"
  headlineSize: 250,             // shrink for longer words
  accent: "vorbeugen",           // handwritten yellow highlight
  sub: "Einfach erklärt für Pflege-Azubis",
  callout: "«Hinweis!»",         // optional yellow pill; must be said in the episode
  variants: {
    // bg: clean 3D frame (grab_world.sh), placed/scaled freely; shade: left-side darkening for the copy
    a: {
      bg: { src: "world-a.png", x: 470, y: -60, w: 1920, h: 1140, scale: 1.12, origin: "30% 60%" },
      shade: "linear-gradient(90deg, #0b1622 0%, #0b1622 30%, rgba(11,22,34,.7) 46%, rgba(11,22,34,0) 62%)",
      callout: { box: [1150, 250], from: [1330, 350], to: [1300, 598] },
    },
    b: {
      bg: { src: "world-b.png" },
    },
  },
};
