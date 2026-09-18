import fs from "node:fs";

const parseAssignment = path => {
  const text = fs.readFileSync(path, "utf8");
  const start = text.indexOf("=") + 1;
  return JSON.parse(text.slice(start).replace(/;\s*$/, ""));
};

const ids = [
  "albania", "armenia", "austria", "azerbaijan", "belarus", "belgium",
  "bosniaHerzegovina", "bulgaria", "croatia", "czechia", "cyprus", "denmark",
  "estonia", "finland", "france", "georgia", "greece", "hungary", "iceland",
  "ireland", "italy", "kosovo", "latvia", "lithuania", "luxembourg",
  "macedonia-fyrom-north-macedonia", "malta", "moldova", "montenegro", "netherlands",
  "norway", "poland", "portugal", "romania", "russia", "serbia", "slovakia",
  "slovenia", "spain", "sweden", "switzerland", "turkey", "uk", "ukraine", "westGermany"
];

const official = parseAssignment("euro-cshapes-official.js").map(feature => {
  if (/belarus|byelorussia/i.test(`${feature.name} ${feature.statename}`)) {
    return { ...feature, id: "belarus", name: "Belarus", statename: "Belarus" };
  }
  return feature.id === "ottoman" && feature.from >= 1923
    ? { ...feature, id: "turkey", name: "Turkey", statename: "Turkey" }
    : feature;
});
const modern = ids.map(id => official
  .filter(feature => feature.id === id && feature.to === 2019)
  .sort((a, b) => b.from - a.from)[0])
  .filter(Boolean)
  .map(feature => ({
    ...feature,
    from: 2020,
    to: 2026,
    startdate: "2020-01-01",
    enddate: "2026-12-31",
    source: "ETH Zurich CShapes 2.0 official boundary · 2020—2026 reference"
  }));

fs.writeFileSync(
  "euro-cshapes-modern-2020-2026.js",
  `window.EURO_CSHAPES_MODERN_FEATURES=${JSON.stringify(modern)};\n`,
  "utf8"
);
console.log(`built ${modern.length} official 2020—2026 features`);
