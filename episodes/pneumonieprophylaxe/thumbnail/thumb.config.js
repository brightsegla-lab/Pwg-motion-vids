// Pneumonieprophylaxe thumbnail — lungs from the episode (clean 3D frames, scripts/grab_world.sh).
// Words: "Pneumonie" + series formula "vorbeugen"; callout words are said in the episode.
window.THUMB = {
  theme: "light",
  chip: "Prophylaxen-Reihe",
  headline: "PNEUMONIE",
  headlineSize: 150,
  accent: "vorbeugen",
  sub: "Einfach erklärt für Pflege-Azubis",
  callout: "Entzündung",
  variants: {
    // a: inflamed lungs (alveoli turn murky on "Entzündung des Lungengewebes")
    a: {
      bg: { src: "world-a.png", x: 900, y: -70, w: 1920, h: 1080, scale: 1.3, origin: "40% 35%" },
      base: "#f1ebde",
      shade: "linear-gradient(90deg, #f1ebde 0%, #f1ebde 44%, rgba(241,235,222,0) 60%)",
      callout: { box: [1300, 96], from: [1560, 190], to: [1610, 360] },
    },
    // b: atelectasis — the grey lobe ("luftleerer Lungenbezirk")
    b: {
      bg: { src: "world-b.png", x: 760, y: -60, w: 1920, h: 1080, scale: 1.3, origin: "40% 35%" },
      base: "#f1ebde",
      shade: "linear-gradient(90deg, #f1ebde 0%, #f1ebde 44%, rgba(241,235,222,0) 60%)",
      callout: { box: [1150, 96], from: [1300, 190], to: [1150, 640] },
      calloutText: "luftleer",
    },
  },
};
