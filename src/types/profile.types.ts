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
