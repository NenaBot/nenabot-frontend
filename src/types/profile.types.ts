/**
 * Type definitions for profile settings and scanning parameters.
 *
 * Defines interfaces for user profiles containing scanning preferences,
 * measurement parameters, and hardware configuration.
 */
export interface ProfileSettings {
  workZ: number;
  workR: number;
  threshold: number;
  options: Record<string, unknown>;
}

export interface ProfileModel {
  name: string;
  description: string;
  settings: ProfileSettings;
}
