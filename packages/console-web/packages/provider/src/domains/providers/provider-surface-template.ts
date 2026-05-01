const surfaceTemplateTokenPattern = /\{([a-zA-Z0-9_]+)\}/g;

export function surfaceBaseURLTemplateParameters(baseURL: string): string[] {
  const normalized = baseURL.trim();
  if (!normalized) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of normalized.matchAll(surfaceTemplateTokenPattern)) {
    const key = (match[1] || "").trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function resolveSurfaceBaseURLTemplate(baseURL: string, values: Record<string, string>): string {
  const normalized = baseURL.trim();
  if (!normalized) {
    return "";
  }
  return normalized.replace(surfaceTemplateTokenPattern, (_, rawKey: string) => {
    const key = (rawKey || "").trim();
    return (values[key] || "").trim();
  });
}

export function defaultSurfaceTemplateValues(baseURL: string): Record<string, string> {
  const fields = surfaceBaseURLTemplateParameters(baseURL);
  if (fields.length === 0) {
    return {};
  }
  return fields.reduce<Record<string, string>>((acc, key) => {
    acc[key] = "";
    return acc;
  }, {});
}

export function hasSurfaceBaseURLTemplate(baseURL: string): boolean {
  return surfaceBaseURLTemplateParameters(baseURL).length > 0;
}
