import "obsidian";

declare module "obsidian" {
  interface App {
    appId: string;
    loadLocalStorage: (key: string) => string | null;
    saveLocalStorage: (key: string, value: unknown) => void;
  }
}
