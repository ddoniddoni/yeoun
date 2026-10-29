import type { RetroControls } from './retroControls';
export const COLLECTION_IDS = ['light', 'time', 'scene', 'retro'] as const;
export type CollectionId = typeof COLLECTION_IDS[number];

export type FilterControls = Readonly<{
  intensity: number;
  grain: number;
  bloom: number;
}>;

// Shared data contract only; constructing this type does not validate restored JSON.
// The original mode bypasses all style effects in the future renderer.
export type RenderSettings = FilterControls & Readonly<{
  filterId: string;
  lookVersion: string;
  engineVersion: string;
}>;

export type Rgb = readonly [number, number, number];
export type TonePoint = readonly [number, number];
export type ToneCurve = readonly [TonePoint, TonePoint, TonePoint, TonePoint, TonePoint, TonePoint];

export type HueBand = Readonly<{
  centerDeg: number;
  halfWidthDeg: number;
  shiftDeg: number;
  saturationMultiplier: number;
}>;

export type FilterAuthoring = Readonly<{
  colorSpace: 'srgb-encoded';
  exposureEv: number;
  saturation: number;
  toneCurve: ToneCurve;
  shadowTintRgb: Rgb;
  highlightTintRgb: Rgb;
  hueBands: readonly HueBand[];
}>;

// Authoring drafts are deliberately distinct from a future renderable manifest.
export type DraftFilter = Readonly<{
  id: string;
  collection: CollectionId;
  name: string;
  caption: string;
  lookVersion: '0.1.0-draft' | '0.2.0-draft' | '0.3.0-draft' | '0.4.0-draft' | '0.5.0-draft' | '0.6.0-draft';
  status: 'design-draft';
  lut: null;
  authoring: FilterAuthoring;
  defaults: FilterControls & Partial<RetroControls>;
  notes: readonly string[];
}>;

export type FilterCollection = Readonly<{
  id: CollectionId;
  name: string;
  subtitle: string;
  representativeId: string;
}>;

export type LutContract = Readonly<{
  size: 33;
  tilesPerRow: 6;
  paddingPixels: 1;
  atlasWidth: 210;
  atlasHeight: 210;
  inputSpace: 'srgb-encoded';
  outputSpace: 'srgb-encoded';
  axisOrder: 'r-fastest-g-next-b-slice';
  alpha: 1;
}>;

export type FilterSeed = Readonly<{
  $schema: string;
  schemaVersion: 1;
  status: 'design-draft';
  createdAt: string;
  description: string;
  renderContractVersion: string;
  lutContract: LutContract;
  collections: readonly FilterCollection[];
  filters: readonly DraftFilter[];
}>;

export type FilterSeedIssue = Readonly<{
  kind: 'schema' | 'semantic';
  code: string;
  /** JSON Pointer; the empty string denotes the document root. */
  path: string;
  message: string;
}>;

export type FilterSeedResult =
  | Readonly<{ ok: true; data: FilterSeed }>
  | Readonly<{ ok: false; issues: readonly FilterSeedIssue[] }>;
