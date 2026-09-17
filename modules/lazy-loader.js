/* The European seed is bundled locally; this hook keeps the original atlas
 * architecture available for future large GeoJSON or period modules. */
window.ensureHistoricalData=async()=>window.EURO_CSHAPES_FEATURES||[];
