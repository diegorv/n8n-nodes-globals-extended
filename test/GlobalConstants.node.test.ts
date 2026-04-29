import { GlobalConstants } from '../nodes/GlobalConstants/GlobalConstants.node';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

function buildExecuteFunctions(overrides: {
  credentials?: Record<string, any>;
  parameters?: Record<string, any>;
  inputData?: INodeExecutionData[];
  continueOnFail?: boolean;
}): IExecuteFunctions {
  const credentials = overrides.credentials ?? {
    format: 'string',
    globalConstants: 'KEY1=value1\nKEY2=value2',
  };
  const parameters = overrides.parameters ?? { putAllInOneKey: true, constantsKeyName: 'constants' };
  const inputData = overrides.inputData ?? [];
  const continueOnFail = overrides.continueOnFail ?? false;

  return {
    getCredentials: jest.fn().mockResolvedValue(credentials),
    getNodeParameter: jest.fn((name: string) => parameters[name]),
    getInputData: jest.fn().mockReturnValue(inputData),
    continueOnFail: jest.fn().mockReturnValue(continueOnFail),
  } as unknown as IExecuteFunctions;
}

describe('GlobalConstants node', () => {
  let node: GlobalConstants;

  beforeEach(() => {
    node = new GlobalConstants();
  });

  describe('putAllInOneKey: true', () => {
    it('groups constants under the default "constants" key', async () => {
      const ctx = buildExecuteFunctions({
        parameters: { putAllInOneKey: true, constantsKeyName: 'constants' },
        inputData: [],
      });

      const result = await node.execute.call(ctx);

      expect(result[0][0].json).toEqual({
        constants: { KEY1: 'value1', KEY2: 'value2' },
      });
    });

    it('uses a custom key name', async () => {
      const ctx = buildExecuteFunctions({
        parameters: { putAllInOneKey: true, constantsKeyName: 'globals' },
        inputData: [],
      });

      const result = await node.execute.call(ctx);

      expect(result[0][0].json).toEqual({
        globals: { KEY1: 'value1', KEY2: 'value2' },
      });
    });
  });

  describe('putAllInOneKey: false', () => {
    it('spreads each constant as a top-level key', async () => {
      const ctx = buildExecuteFunctions({
        parameters: { putAllInOneKey: false },
        inputData: [],
      });

      const result = await node.execute.call(ctx);

      expect(result[0][0].json).toEqual({ KEY1: 'value1', KEY2: 'value2' });
    });
  });

  describe('input data handling', () => {
    it('creates a new item when there is no input', async () => {
      const ctx = buildExecuteFunctions({ inputData: [] });
      const result = await node.execute.call(ctx);
      expect(result[0]).toHaveLength(1);
    });

    it('merges constants into each existing input item without mutating originals', async () => {
      const original0 = { json: { existingKey: 'existingValue' } };
      const original1 = { json: { anotherKey: 'anotherValue' } };
      const ctx = buildExecuteFunctions({
        parameters: { putAllInOneKey: false },
        inputData: [original0, original1],
      });

      const result = await node.execute.call(ctx);

      expect(result[0]).toHaveLength(2);
      expect(result[0][0].json).toEqual({
        existingKey: 'existingValue',
        KEY1: 'value1',
        KEY2: 'value2',
      });
      expect(result[0][1].json).toEqual({
        anotherKey: 'anotherValue',
        KEY1: 'value1',
        KEY2: 'value2',
      });

      // originals must not be mutated
      expect(original0.json).toEqual({ existingKey: 'existingValue' });
      expect(original1.json).toEqual({ anotherKey: 'anotherValue' });
    });

    it('preserves binary data from input items', async () => {
      const binaryData = { data: { data: 'base64==', mimeType: 'image/png', fileExtension: 'png' } };
      const ctx = buildExecuteFunctions({
        parameters: { putAllInOneKey: false },
        inputData: [{ json: { existingKey: 'val' }, binary: binaryData }],
      });

      const result = await node.execute.call(ctx);

      expect(result[0][0].binary).toEqual(binaryData);
    });

    it('sets pairedItem for each output item', async () => {
      const ctx = buildExecuteFunctions({
        parameters: { putAllInOneKey: false },
        inputData: [
          { json: { a: 1 } },
          { json: { b: 2 } },
        ],
      });

      const result = await node.execute.call(ctx);

      expect(result[0][0].pairedItem).toEqual({ item: 0 });
      expect(result[0][1].pairedItem).toEqual({ item: 1 });
    });
  });

  describe('JSON format', () => {
    it('parses JSON credentials correctly', async () => {
      const ctx = buildExecuteFunctions({
        credentials: {
          format: 'json',
          globalConstants: '{"API_URL": "https://api.example.com", "TIMEOUT": 30}',
        },
        parameters: { putAllInOneKey: false },
        inputData: [],
      });

      const result = await node.execute.call(ctx);

      expect(result[0][0].json).toEqual({
        API_URL: 'https://api.example.com',
        TIMEOUT: 30,
      });
    });
  });

  describe('continueOnFail', () => {
    it('returns error object when continueOnFail is true and credential is invalid', async () => {
      const ctx = buildExecuteFunctions({
        credentials: { format: 'json', globalConstants: '{ invalid json }' },
        parameters: { putAllInOneKey: false },
        continueOnFail: true,
      });

      const result = await node.execute.call(ctx);

      expect(result[0][0].json).toHaveProperty('error');
      expect(typeof result[0][0].json.error).toBe('string');
    });

    it('throws when continueOnFail is false and credential is invalid', async () => {
      const ctx = buildExecuteFunctions({
        credentials: { format: 'json', globalConstants: '{ invalid json }' },
        parameters: { putAllInOneKey: false },
        continueOnFail: false,
      });

      await expect(node.execute.call(ctx)).rejects.toThrow();
    });
  });
});
