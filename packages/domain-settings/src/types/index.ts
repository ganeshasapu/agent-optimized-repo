export interface SettingsSection {
  id: string;
  label: string;
  description: string;
}

export interface ProfileSettings {
  name: string;
  email: string;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
}
