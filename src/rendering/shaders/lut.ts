import { LUT_CONTRACT } from '../reference/lutAtlas.ts';

// Backend version only; this does not change the authoring engine or stored PNGs.
export const LUT_SKIA_BACKEND_VERSION = 'skia-alpha-planes-0.2.0';

/** Skia 2.4.18 has no JS makeRawShader. Only .a of Alpha_8 children carries LUT data. */
export const LUT_SKSL = `
uniform shader sourceImage;
uniform shader lutRed;
uniform shader lutGreen;
uniform shader lutBlue;
uniform float intensity;

float encodeSrgb(float value) {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * pow(value, 1.0 / 2.4) - 0.055;
}
float decodeSrgb(float value) {
  return value <= 0.04045 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4);
}

float3 readSlice(float2 rg, float slice) {
  const float tilesPerRow = ${LUT_CONTRACT.tilesPerRow}.0;
  const float tileSize = ${LUT_CONTRACT.size + 2 * LUT_CONTRACT.paddingPixels}.0;
  float row = floor(slice / tilesPerRow);
  float column = slice - row * tilesPerRow;
  // SkImage shader coordinates are pixels, with half-pixel centers (not normalized UV).
  float2 xy = float2(column, row) * tileSize + ${LUT_CONTRACT.paddingPixels}.5 + rg;
  return float3(lutRed.eval(xy).a, lutGreen.eval(xy).a, lutBlue.eval(xy).a);
}

half4 main(float2 xy) {
  half4 source = sourceImage.eval(xy);
  if (intensity <= 0.0) return source;
  float alpha = float(source.a);
  if (alpha <= 0.0) return half4(0.0);
  // Children return premultiplied colors in the destination working space.
  // Callers supply normalized SDR content; this clamp is not an HDR tone mapper.
  float3 linear = clamp(toLinearSrgb(float3(source.rgb) / alpha), 0.0, 1.0);
  float3 encoded = float3(encodeSrgb(linear.r), encodeSrgb(linear.g), encodeSrgb(linear.b));
  float3 position = clamp(encoded, 0.0, 1.0) * ${LUT_CONTRACT.size - 1}.0;
  float low = floor(position.b);
  float high = min(low + 1.0, ${LUT_CONTRACT.size - 1}.0);
  float3 looked = mix(readSlice(position.rg, low), readSlice(position.rg, high), position.b - low);
  // One master mix in encoded sRGB, shared by preview and JPEG export.
  looked = mix(encoded, looked, intensity);
  float3 lookedLinear = float3(decodeSrgb(looked.r), decodeSrgb(looked.g), decodeSrgb(looked.b));
  float3 working = fromLinearSrgb(lookedLinear);
  return half4(working * alpha, alpha);
}
`;
