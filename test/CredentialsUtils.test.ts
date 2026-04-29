import { splitConstants } from '../credentials/CredentialsUtils';

describe('CredentialsUtils', () => {
  describe('splitConstants', () => {
    describe('format: string (key=value)', () => {
      it('should split constants correctly (trivial case)', () => {
        const input = `
CONSTANT1=value1
CONSTANT2=value2
CONSTANT3=value3
        `.trim();

        const result = splitConstants(input, 'string');

        expect(result).toEqual({
          CONSTANT1: 'value1',
          CONSTANT2: 'value2',
          CONSTANT3: 'value3',
        });
      });

      it('should handle empty lines', () => {
        const input = `
CONSTANT1=value1

CONSTANT2=value2
        `.trim();

        const result = splitConstants(input, 'string');

        expect(result).toEqual({
          CONSTANT1: 'value1',
          CONSTANT2: 'value2',
        });
      });

      it('should skip lines without "="', () => {
        const input = `
CONSTANT1=value1
INVALID_LINE
CONSTANT2=value2
        `.trim();

        const result = splitConstants(input, 'string');

        expect(result).toEqual({
          CONSTANT1: 'value1',
          CONSTANT2: 'value2',
        });
      });

      it('should handle multiple "=" in a line', () => {
        const input = `
CONSTANT1=value=with=equals
CONSTANT2=another=value
        `.trim();
        const result = splitConstants(input, 'string');

        expect(result).toEqual({
          CONSTANT1: 'value=with=equals',
          CONSTANT2: 'another=value',
        });
      });

      it('should not parse JSON-looking input as JSON', () => {
        const input = `{ "CONSTANT1": "value1" }`;
        const result = splitConstants(input, 'string');
        expect(result).toEqual({});
      });

      it('should default to string format when format is omitted', () => {
        const input = `KEY=value`;
        const result = splitConstants(input);
        expect(result).toEqual({ KEY: 'value' });
      });
    });

    describe('format: json', () => {
      it('should parse a valid JSON object', () => {
        const input = `
{
  "CONSTANT1": "value1",
  "CONSTANT2": "value2",
  "OBJECT": { "key": "value" }
}
        `.trim();
        const result = splitConstants(input, 'json');

        expect(result).toEqual({
          CONSTANT1: 'value1',
          CONSTANT2: 'value2',
          OBJECT: { key: 'value' },
        });
      });

      it('should parse arrays inside JSON', () => {
        const input = `{ "LIST": ["a", "b", "c"] }`;
        const result = splitConstants(input, 'json');
        expect(result).toEqual({ LIST: ['a', 'b', 'c'] });
      });

      it('should throw an error for invalid JSON', () => {
        const input = `{ invalid json }`;
        expect(() => splitConstants(input, 'json')).toThrow();
      });

      it('should throw an error for empty string', () => {
        const input = ``;
        expect(() => splitConstants(input, 'json')).toThrow();
      });
    });
  });
});
