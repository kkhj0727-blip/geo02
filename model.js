export const DEFAULTS = Object.freeze({ area: 80, pollution: 20, protection: 60 });
export function calculate({ area, pollution, protection }) {
  const clamp = n => Math.max(0, Math.min(100, Number(n) || 0));
  const a = clamp(area) / 100, p = clamp(pollution) / 100, c = clamp(protection) / 100;
  const habitat = (1 - .7 * p) * (.65 + .35 * c);
  return {
    habitat: Math.round(100 * a * habitat),
    birds: Math.round(100 * a * Math.sqrt(habitat)),
    purification: Math.round(100 * a * (1 - .5 * p))
  };
}
