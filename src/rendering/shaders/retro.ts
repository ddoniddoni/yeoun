// Procedural effects in oriented crop coordinates. No bitmap overlays, fonts,
// temporal random state, extra full-size surface, or source pixel readback.
export const RETRO_SKSL = `
uniform float vignette;
uniform float halation;
uniform float sharpness;
uniform float softness;
uniform float digitalNoise;
uniform float lightLeak;
uniform float dust;
uniform float dateStamp;
uniform float stampDate;

float retroHash(float2 cell, float salt) {
  cell = mod(floor(cell), 1600.0);
  float h = mod(cell.x + cell.y * 131.0 + seed * 17.0 + salt * 43.0, 4093.0);
  float h2 = mod(h * h, 4093.0);
  float h4 = mod(h2 * h2, 4093.0);
  return mod(mod(h4 * h, 4093.0) * 109.0 + 1021.0, 4093.0) / 4092.0;
}
float3 sharpenLook(float2 xy, float3 center) {
  if (sharpness <= 0.0) return center;
  float radius = max(size.x, size.y) / 1600.0;
  float3 neighbors = (linearColor(looked.eval(xy + float2(radius, 0.0))) +
    linearColor(looked.eval(xy - float2(radius, 0.0))) +
    linearColor(looked.eval(xy + float2(0.0, radius))) +
    linearColor(looked.eval(xy - float2(0.0, radius)))) * 0.25;
  return clamp(center + (center - neighbors) * sharpness * 1.5, 0.0, 1.0);
}
float3 detailLook(float2 xy, float3 center) {
  float3 detailed = sharpenLook(xy, center);
  if (softness <= 0.0) return detailed;
  // Normalized to the oriented crop: preview/export use the same relative radius.
  // Symmetric 3x3 binomial kernel; no new surface or frame pixel readback.
  float radius = max(size.x, size.y) * 0.0025;
  float3 axes = linearColor(looked.eval(xy + float2(radius, 0.0))) +
    linearColor(looked.eval(xy - float2(radius, 0.0))) +
    linearColor(looked.eval(xy + float2(0.0, radius))) +
    linearColor(looked.eval(xy - float2(0.0, radius)));
  float3 diagonals = linearColor(looked.eval(xy + float2(radius, radius))) +
    linearColor(looked.eval(xy + float2(radius, -radius))) +
    linearColor(looked.eval(xy + float2(-radius, radius))) +
    linearColor(looked.eval(xy - float2(radius, radius)));
  float3 softened = (center * 4.0 + axes * 2.0 + diagonals) / 16.0;
  return mix(detailed, softened, softness);
}
float3 applyRetro(float3 color, float2 p) {
  float longest = max(size.x, size.y);
  float2 uv = p / size;
  if (digitalNoise > 0.0) {
    float2 cell = floor(p * (1600.0 / longest));
    float3 n = float3(retroHash(cell, 1.0), retroHash(cell, 2.0), retroHash(cell, 3.0)) * 2.0 - 1.0;
    float shadow = 0.25 + 0.75 * (1.0 - dot(color, float3(0.2126, 0.7152, 0.0722)));
    color += n * 0.055 * digitalNoise * shadow * min(1.0, longest / 1600.0);
  }
  if (vignette > 0.0) {
    float2 centered = uv * 2.0 - 1.0;
    color *= 1.0 - 0.55 * vignette * smoothstep(0.2, 1.6, dot(centered, centered));
  }
  if (lightLeak > 0.0) {
    float side = mod(seed, 2.0) < 1.0 ? uv.x : 1.0 - uv.x;
    float center = 0.2 + 0.6 * mod(seed, 17.0) / 16.0;
    float dy = (uv.y - center) * 1.7;
    float leak = exp(-side * 9.0) * exp(-dy * dy) * lightLeak * 0.7;
    color = 1.0 - (1.0 - clamp(color, 0.0, 1.0)) * (1.0 - float3(1.0, 0.27, 0.055) * leak);
  }
  if (dust > 0.0) {
    float2 grid = p / longest * 64.0;
    float2 cell = floor(grid);
    float2 center = float2(retroHash(cell, 5.0), retroHash(cell, 6.0)) * 0.6 + 0.2;
    float radius = mix(0.035, 0.09, retroHash(cell, 7.0));
    float aa = max(0.003, 64.0 / longest);
    float fleck = (1.0 - smoothstep(radius, radius + aa, length(fract(grid) - center))) *
      step(0.965, retroHash(cell, 4.0)) * dust * 0.65;
    color = mix(color, float3(step(0.5, retroHash(cell, 8.0))), fleck);
  }
  return clamp(color, 0.0, 1.0);
}
float stampBox(float2 p, float2 center, float2 extent, float aa) {
  float2 d = abs(p - center) - extent;
  return 1.0 - smoothstep(-aa, aa, max(d.x, d.y));
}
float digitMask(float2 p, float digit, float aa) {
  // Seven-segment a,b,c,d,e,f,g masks for 0..9. Arithmetic avoids backend bitwise differences.
  float mask = 63.0;
  if (digit < 0.5) mask = 63.0;
  else if (digit < 1.5) mask = 6.0;
  else if (digit < 2.5) mask = 91.0;
  else if (digit < 3.5) mask = 79.0;
  else if (digit < 4.5) mask = 102.0;
  else if (digit < 5.5) mask = 109.0;
  else if (digit < 6.5) mask = 125.0;
  else if (digit < 7.5) mask = 7.0;
  else if (digit < 8.5) mask = 127.0;
  else mask = 111.0;
  float result = 0.0;
  result = max(result, mod(floor(mask), 2.0) * stampBox(p, float2(0.28, 0.08), float2(0.18, 0.035), aa));
  result = max(result, mod(floor(mask/2.0), 2.0) * stampBox(p, float2(0.49, 0.29), float2(0.035, 0.16), aa));
  result = max(result, mod(floor(mask/4.0), 2.0) * stampBox(p, float2(0.49, 0.71), float2(0.035, 0.16), aa));
  result = max(result, mod(floor(mask/8.0), 2.0) * stampBox(p, float2(0.28, 0.92), float2(0.18, 0.035), aa));
  result = max(result, mod(floor(mask/16.0), 2.0) * stampBox(p, float2(0.07, 0.71), float2(0.035, 0.16), aa));
  result = max(result, mod(floor(mask/32.0), 2.0) * stampBox(p, float2(0.07, 0.29), float2(0.035, 0.16), aa));
  result = max(result, mod(floor(mask/64.0), 2.0) * stampBox(p, float2(0.28, 0.5), float2(0.18, 0.035), aa));
  return result;
}
float stampMask(float2 p) {
  float height = min(size.x, size.y) * 0.032;
  float2 local = (p - float2(size.x * 0.96 - height * 5.6, size.y * 0.95 - height)) / height;
  if (local.x < -0.1 || local.x > 5.6 || local.y < -0.1 || local.y > 1.1) return 0.0;
  float result = 0.0;
  float aa = 0.6 / height;
  for (int i = 0; i < 8; ++i) {
    float2 q = local - float2(float(i) * 0.7, 0.0);
    if (i == 2 || i == 5) {
      result = max(result, stampBox(q, float2(0.28, 0.9), float2(0.045), aa));
    } else {
      int index = i - (i > 2 ? 1 : 0) - (i > 5 ? 1 : 0);
      float digit = mod(floor(stampDate / pow(10.0, float(5 - index))), 10.0);
      result = max(result, digitMask(q, digit, aa));
    }
  }
  return result;
}
`;
