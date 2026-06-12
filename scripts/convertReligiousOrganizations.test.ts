import { describe, expect, it } from 'vitest';
import { parseOdsCells } from './convertReligiousOrganizations';

describe('ODS conversion parser', () => {
  it('keeps later cells aligned after self-closing blank cells', () => {
    const cells = parseOdsCells(
      [
        '<table:table-cell office:value-type="string"><text:p>金鶴宮</text:p></table:table-cell>',
        '<table:table-cell table:style-name="ce1"/>',
        '<table:table-cell table:number-columns-repeated="2"/>',
        '<table:table-cell office:value-type="float" office:value="304806.42"><text:p>304806.42</text:p></table:table-cell>',
      ].join(''),
      5,
    );

    expect(cells).toEqual(['金鶴宮', '', '', '', '304806.42']);
  });
});
