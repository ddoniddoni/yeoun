import { applyMatrix, matrixFor } from '../../src/domain/filters/testFilter';
test.each([[0, 0, 0, 1], [1, 1, 1, 1], [1, 0, 0, 1], [0.2, 0.4, 0.6, 1]])('identity preserves %j', (...rgba) => {
  expect(applyMatrix(rgba, matrixFor('identity'))).toEqual(rgba);
});
test('warm is deterministic, preserves alpha and clamps highlights', () => {
  expect(applyMatrix([1, 1, 1, 1], matrixFor('warm'))).toEqual([1, 1, 0.92, 1]);
  expect(applyMatrix([0.5, 0.5, 0.5, 1], matrixFor('warm'))).toEqual([0.535, 0.505, 0.46, 1]);
});
test('bad numeric values are rejected', () => {
  expect(() => applyMatrix([NaN, 0, 0, 1], matrixFor('warm'))).toThrow();
});
