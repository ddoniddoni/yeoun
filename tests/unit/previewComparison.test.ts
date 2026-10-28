import { initialComparison, updateComparison } from '../../src/domain/filters/previewComparison';

test('release restores the selected look with a fresh request revision, even after a short hold', () => {
  const initial = initialComparison('summer');
  const held = updateComparison(initial, 'summer', 'hold');
  const released = updateComparison(held, 'summer', 'release');
  expect(held.held).toBe(true);
  expect(released.held || released.pinned).toBe(false);
  expect(released.revision).toBeGreaterThan(held.revision);
  expect(held.revision).toBeGreaterThan(initial.revision);
  expect(initial.held).toBe(false);
});

test('accessible toggle does not depend on a held gesture and release cannot switch it off', () => {
  const held = updateComparison(initialComparison('summer'), 'summer', 'hold');
  const pinned = updateComparison(held, 'summer', 'toggle');
  const released = updateComparison(pinned, 'summer', 'release');
  expect(released).toMatchObject({ held: false, pinned: true });
  expect(updateComparison(released, 'summer', 'toggle')).toMatchObject({ held: false, pinned: false });
});

test('selection change drops a pin and a delayed release from the old selection cannot cancel a new hold', () => {
  const pinned = updateComparison(initialComparison('summer'), 'summer', 'toggle');
  const changed = updateComparison(pinned, 'dawn', 'reset');
  expect(changed).toMatchObject({ context: 'dawn', held: false, pinned: false });
  const newHold = updateComparison(changed, 'dawn', 'hold');
  expect(updateComparison(newHold, 'summer', 'release')).toBe(newHold);
});

test('interruption clears both modes without reusing a pre-comparison readiness revision', () => {
  let state = initialComparison('summer');
  state = updateComparison(state, 'summer', 'toggle');
  state = updateComparison(state, 'summer', 'hold');
  const reset = updateComparison(state, 'summer', 'reset');
  expect(reset).toMatchObject({ held: false, pinned: false });
  expect(reset.revision).toBeGreaterThan(state.revision);
  expect(updateComparison(reset, 'summer', 'reset')).toBe(reset);
});
