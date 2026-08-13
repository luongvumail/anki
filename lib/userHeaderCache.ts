let globalCachedUserName: string | null = null;

export function getCachedUserName(): string | null {
  return globalCachedUserName;
}

export function setCachedUserName(name: string | null): void {
  globalCachedUserName = name;
}

export function clearHeaderUserCache(): void {
  globalCachedUserName = null;
}
