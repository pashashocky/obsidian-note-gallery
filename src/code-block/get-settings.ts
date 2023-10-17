import { normalizePath, parseYaml, Platform } from "obsidian";
import renderError from "./render-error";

export interface Settings {
  path: string;
  radius: number;
  gutter: number;
  sortby: string;
  sort: string;
  mobile: number;
  columns: number;
  height: number;
}

const DEFAULT_SETTINGS: Settings = {
  path: "",
  radius: 0,
  gutter: 8,
  sortby: "mtime",
  sort: "desc",
  mobile: 1,
  columns: 0,
  height: 260,
};

const getSettings = (src: string, container: HTMLElement) => {
  // parse the settings from the code block
  const settingsSrc: any = parseYaml(src);

  // check for required settings
  if (settingsSrc === undefined) {
    const error = "Cannot parse YAML!";
    renderError(container, error);
    throw new Error(error);
  }

  if (!settingsSrc.path) {
    const error = "Please specify a path!";
    renderError(container, error);
    throw new Error(error);
  }

  // store settings, normalize and set sensible defaults
  const settings: Settings = DEFAULT_SETTINGS;

  settings.path = normalizePath(settingsSrc.path);
  settings.radius = settingsSrc.radius ?? 0;
  settings.gutter = settingsSrc.gutter ?? 8;
  settings.sortby = settingsSrc.sortby ?? "mtime";
  settings.sort = settingsSrc.sort ?? "desc";

  // settings for vertical mansory only
  settings.mobile = settingsSrc.mobile ?? 1;
  if (Platform.isDesktop) settings.columns = settingsSrc.columns ?? 3;
  else settings.columns = settings.mobile;

  // settings for horizontal mansory only
  settings.height = settingsSrc.height ?? 260;

  return settings;
};

export default getSettings;
