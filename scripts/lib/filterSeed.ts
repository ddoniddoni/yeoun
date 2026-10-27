import Ajv2020, { type ErrorObject, type Schema } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { FilterSeed, FilterSeedIssue, FilterSeedResult } from '../../src/domain/filters/types.ts';
import { validateSeedSemantics } from '../../src/domain/filters/validateSeedSemantics.ts';

function schemaIssue(error: ErrorObject): FilterSeedIssue {
  const property: unknown = error.keyword === 'required'
    ? error.params.missingProperty
    : error.keyword === 'additionalProperties' ? error.params.additionalProperty : undefined;
  const suffix = typeof property === 'string'
    ? `/${property.replace(/~/g, '~0').replace(/\//g, '~1')}`
    : '';
  return {
    kind: 'schema',
    code: error.keyword,
    path: error.instancePath + suffix,
    message: error.message ?? '필터 제작 데이터 형식이 올바르지 않습니다.',
  };
}

/** Node authoring tool: pass only the repository's filters.schema.json, never an input-supplied schema. */
export function createFilterSeedValidator(authoringSchema: Schema): (input: unknown) => FilterSeedResult {
  const ajv = new Ajv2020({
    strict: true,
    strictNumbers: true,
    allErrors: true,
    ownProperties: true,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
  });
  addFormats(ajv, ['date']);
  const validateStructure = ajv.compile<FilterSeed>(authoringSchema);

  return input => {
    if (!validateStructure(input)) {
      // Copy errors immediately: Ajv replaces its error collection on the next call.
      return { ok: false, issues: (validateStructure.errors ?? []).map(schemaIssue) };
    }
    const issues = validateSeedSemantics(input);
    return issues.length ? { ok: false, issues } : { ok: true, data: input };
  };
}
