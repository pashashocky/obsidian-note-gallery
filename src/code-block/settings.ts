import { App, MarkdownPostProcessorContext, normalizePath, parseYaml } from "obsidian";
import renderError from "~/code-block/errors";

export interface Settings {
  path: string;
  query: string;
  limit: number;
  recursive: boolean;
  sort: "asc" | "desc";
  sortby: "name" | "mtime" | "ctime";
  sortrandom: boolean;
  fontsize: string;
  showtitle: boolean;
  debugquery: boolean;
  breakpoints: number | { default: number; [key: number]: number };
}

const DEFAULT_SETTINGS: Settings = {
  path: "",
  query: "",
  limit: 0,
  recursive: true,
  sort: "desc",
  sortby: "mtime",
  sortrandom: false,
  fontsize: "6pt",
  showtitle: true,
  debugquery: false,
  breakpoints: {
    default: 4,
    100000: 10,
    3500: 10,
    3100: 9,
    2700: 8,
    2300: 7,
    1900: 6,
    1500: 5,
    1000: 4,
    700: 3,
    400: 2,
    200: 1,
  },
};

type AnyObject = { [key: string]: AnyObject };
const lowercaseKeys = (obj: AnyObject, deep = false) =>
  Object.keys(obj).reduce((acc, key) => {
    acc[key.toLowerCase()] =
      deep && typeof obj[key] === "object" ? lowercaseKeys(obj[key]) : obj[key];
    return acc;
  }, {} as AnyObject);

const getSettings = (
  src: string,
  app: App,
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) => {
  let settingsSrc: AnyObject | undefined = undefined;
  try {
    settingsSrc = parseYaml(src);
  } catch (e) {
    let error = "Cannot parse YAML!";
    if (e instanceof Error) error = e.message;
    renderError(container, error);
    throw e;
  }
  if (settingsSrc === undefined) {
    const error = "Cannot parse YAML!";
    renderError(container, error);
    throw new Error(error);
  }

  if (settingsSrc !== null) {
    settingsSrc = lowercaseKeys(settingsSrc);
  }

  const settings = { ...DEFAULT_SETTINGS, ...settingsSrc };
  if (settingsSrc === null || (!settingsSrc.path && !settingsSrc.query)) {
    const file = app.vault.getAbstractFileByPath(ctx.sourcePath)!.parent!;
    settings.path = file.path;
  }
  if (settings.path) settings.path = normalizePath(settings.path);
  if (!settings.path) settings.path = "";
  if (!settings.query) settings.query = "";
  return settings;
};

export default getSettings;
