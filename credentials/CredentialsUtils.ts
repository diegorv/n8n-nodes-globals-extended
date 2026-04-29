export function splitConstants(
  globalConstantsMultiline: string,
  format: 'string' | 'json' = 'string',
): { [key: string]: any } {
  if (format === 'json') {
    const parsed: unknown = JSON.parse(globalConstantsMultiline.trim());
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Global Constants JSON must be a plain object, e.g. { "KEY": "value" }');
    }
    return parsed as { [key: string]: any };
  }

  const lines = globalConstantsMultiline.split('\n');
  const retArr: { [key: string]: string } = {};
  for (const line of lines) {
    const constant = line.trim();
    if (!constant) {
      continue;
    }
    if (!constant.includes('=')) {
      continue;
    }
    const [name, ...value] = constant.split('=');
    const trimmedName = name.trim();
    if (!trimmedName) {
      continue;
    }
    retArr[trimmedName] = value.join('=').trim();
  }
  return retArr;
}
