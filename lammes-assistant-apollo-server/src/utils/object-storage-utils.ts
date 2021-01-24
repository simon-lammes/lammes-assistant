/**
 * Returns path in which the settings should be stored in BLOB storage.
 */
export function getSettingsUrl(userId: number): string {
  return `users/${userId}/settings.json`;
}
