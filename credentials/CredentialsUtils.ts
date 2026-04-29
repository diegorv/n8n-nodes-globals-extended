export function splitConstants(
  globalConstantsMultiline: string,
  format: 'string' | 'json' = 'string',
): { [key: string]: any } {
  if (format === 'json') {
    return JSON.parse(globalConstantsMultiline.trim()) as { [key: string]: any };
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
    retArr[name.trim()] = value.join('=').trim();
  }
  return retArr;
}
