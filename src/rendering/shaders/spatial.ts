import { RETRO_SKSL } from './retro';
export const SPATIAL_BACKEND_VERSION = 'grain-bloom-retro-0.4.0';

const COLOR = `
float3 linearColor(half4 color) {
  return color.a <= 0.0 ? float3(0.0) : clamp(toLinearSrgb(float3(color.rgb) / float(color.a)), 0.0, 1.0);
}
float encode(float v) { return v <= 0.0031308 ? v * 12.92 : 1.055 * pow(v, 1.0 / 2.4) - 0.055; }
float decode(float v) { return v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4); }
float3 encoded(float3 v) { return float3(encode(v.r), encode(v.g), encode(v.b)); }
float3 decoded(float3 v) { return float3(decode(v.r), decode(v.g), decode(v.b)); }
`;
const MAP = `
uniform float a; uniform float b; uniform float c; uniform float d; uniform float tx; uniform float ty;
float2 mapped(float2 p) { return float2(a*p.x + c*p.y + tx, b*p.x + d*p.y + ty); }
`;

// Four footprint samples, extracted AFTER LUT, before downsampling. Opaque camera/JPEG input.
export const BRIGHT_SKSL = `
uniform shader looked;
${MAP}
uniform float2 size;
uniform float2 scale;
${COLOR}
float3 bright(float2 p) {
  float3 linear = linearColor(looked.eval(mapped(clamp(p / scale, float2(0.5), size - 0.5))));
  return linear * smoothstep(0.65, 0.95, dot(linear, float3(0.2126, 0.7152, 0.0722)));
}
half4 main(float2 p) {
  float3 value = (bright(p + float2(-0.25, -0.25)) + bright(p + float2(0.25, -0.25)) +
    bright(p + float2(-0.25, 0.25)) + bright(p + float2(0.25, 0.25))) * 0.25;
  return half4(fromLinearSrgb(value), 1.0);
}
`;

// Two bounded 11-tap passes. Intermediate images are read as linear light explicitly.
export const BLUR_SKSL = `
uniform shader image;
uniform float2 direction;
uniform float sigma;
${COLOR}
half4 main(float2 p) {
  float3 sum = float3(0.0); float total = 0.0;
  for (int i = -5; i <= 5; ++i) {
    float offset = float(i);
    float weight = exp(-0.5 * offset * offset / max(sigma*sigma, 0.000001));
    sum += linearColor(image.eval(p + direction * offset)) * weight;
    total += weight;
  }
  return half4(fromLinearSrgb(sum / total), 1.0);
}
`;

export const SPATIAL_SKSL = `
uniform shader source;
uniform shader looked;
uniform shader blurred;
${MAP}
uniform float2 size;
uniform float2 bloomScale;
uniform float intensity;
uniform float grain;
uniform float bloom;
uniform float seed;
uniform float grainResolution;
uniform float grainAmplitude;
${COLOR}
${RETRO_SKSL}
float hash(float2 cell) {
  cell = clamp(cell, float2(0.0), float2(1599.0));
  float h = mod(cell.x + cell.y * 131.0 + seed * 17.0, 4093.0);
  float h2 = mod(h*h, 4093.0);
  float h4 = mod(h2*h2, 4093.0);
  h = mod(h4*h, 4093.0);
  return mod(h * 109.0 + 1021.0, 4093.0) / 2046.0 - 1.0;
}
float noise(float2 p) {
  float2 cell = floor(p); float2 f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(hash(cell), hash(cell + float2(1.0, 0.0)), f.x),
    mix(hash(cell + float2(0.0, 1.0)), hash(cell + 1.0), f.x), f.y);
}
float filteredNoise(float2 xy) {
  float longest = max(size.x, size.y);
  float2 p = clamp(xy, float2(0.0), size) * (grainResolution / longest);
  float offset = max(1.0, grainResolution / longest) * 0.25;
  return (noise(p + float2(-offset, -offset)) + noise(p + float2(offset, -offset)) +
    noise(p + float2(-offset, offset)) + noise(p + float2(offset, offset))) * 0.25 * min(1.0, longest / grainResolution);
}
float3 bloomAt(float2 p) {
  float2 cell = floor(p - 0.5) + 0.5; float2 f = fract(p - 0.5);
  return mix(mix(linearColor(blurred.eval(cell)), linearColor(blurred.eval(cell + float2(1.0, 0.0))), f.x),
    mix(linearColor(blurred.eval(cell + float2(0.0, 1.0))), linearColor(blurred.eval(cell + 1.0)), f.x), f.y);
}
half4 main(float2 xy) {
  half4 original = source.eval(xy);
  if (intensity <= 0.0 || original.a <= 0.0) return original;
  float2 normalized = mapped(xy);
  float3 linear = detailLook(xy, linearColor(looked.eval(xy)));
  if (halation > 0.0) {
    float3 halo = bloomAt(normalized * bloomScale);
    float luminance = dot(linear, float3(0.2126, 0.7152, 0.0722));
    float edge = max(0.0, dot(halo, float3(0.2126, 0.7152, 0.0722)) -
      luminance * smoothstep(0.65, 0.95, luminance));
    linear = clamp(linear + edge * halation * float3(0.9, 0.14, 0.025), 0.0, 1.0);
  }
  if (bloom > 0.0) linear = clamp(linear + 0.6 * bloom * bloomAt(normalized * bloomScale), 0.0, 1.0);
  float3 styled = encoded(linear);
  if (grain > 0.0) {
    float y = dot(styled, float3(0.2126, 0.7152, 0.0722));
    float envelope = 0.35 + 0.65 * (1.0 - abs(2.0*y - 1.0));
    styled = clamp(styled + filteredNoise(normalized) * grainAmplitude * grain * envelope, 0.0, 1.0);
  }
  styled = applyRetro(styled, normalized);
  if (dateStamp > 0.0) styled = mix(styled, float3(1.0, 0.43, 0.12), stampMask(normalized) * 0.95);
  float3 mixed = mix(encoded(linearColor(original)), styled, intensity);
  return half4(fromLinearSrgb(decoded(mixed)) * float(original.a), original.a);
}
`;
