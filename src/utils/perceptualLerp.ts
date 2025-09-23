import * as THREE from "three";

export type OKLCH = { L: number; C: number; h: number };

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function toSRGB(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

export function rgbToOklch(c: THREE.Color): OKLCH {
  const r = toLinear(c.r);
  const g = toLinear(c.g);
  const b = toLinear(c.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.hypot(a, b2);
  let h = Math.atan2(b2, a);
  if (h < 0) h += Math.PI * 2.0;
  h = (h * 180) / Math.PI;
  return { L, C, h };
}

export function oklchToRgb(ok: OKLCH): { r: number; g: number; b: number } {
  const { L, C } = ok;
  const hRad = (ok.h * Math.PI) / 180.0;
  const a = C * Math.cos(hRad);
  const b2 = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b2;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b2;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b2;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const r = toSRGB(rLin);
  const g = toSRGB(gLin);
  const b = toSRGB(bLin);

  return {
    r: THREE.MathUtils.clamp(r, 0, 1),
    g: THREE.MathUtils.clamp(g, 0, 1),
    b: THREE.MathUtils.clamp(b, 0, 1),
  };
}

export function lerpHueShortest(h0: number, h1: number, t: number): number {
  const dh = ((h1 - h0 + 540) % 360) - 180;
  return (h0 + dh * THREE.MathUtils.clamp(t, 0, 1) + 360) % 360;
}

type LerpOpts = {
  t: number; // 0..1
  nudgeL?: number;
  nudgeC?: number;
  z?: number;
  period?: number;
};

export function perceptualLerpOKLCH(
  frontSRGB: THREE.Color,
  backSRGB: THREE.Color,
  opts: LerpOpts
): THREE.Color {
  const f = rgbToOklch(frontSRGB);
  const b = rgbToOklch(backSRGB);
  const t = THREE.MathUtils.clamp(opts.t, 0, 1);

  let L = THREE.MathUtils.lerp(f.L, b.L, t);
  let C = THREE.MathUtils.lerp(f.C, b.C, t);
  const h = lerpHueShortest(f.h, b.h, t);

  if (opts.z !== undefined && opts.period && opts.period > 0) {
    const ripple = Math.sin((2 * Math.PI * opts.z) / opts.period);
    if (opts.nudgeL) L += opts.nudgeL * ripple;
    if (opts.nudgeC) C *= 1 + opts.nudgeC * (opts.z % 2 === 0 ? 1 : -1);
  }

  const { r, g, b: bb } = oklchToRgb({ L, C: Math.max(0, C), h });
  return new THREE.Color(r, g, bb).convertSRGBToLinear();
}