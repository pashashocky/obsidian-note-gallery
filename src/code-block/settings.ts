import { App, MarkdownPostProcessorContext, normalizePath, parseYaml } from "obsidian";
import renderError from "~/code-block/errors";

export interface Settings {
  path: string;
  query: string;
  limit: number;
  recursive: boolean;
  sort: "asc" | "desc";
  sortby: "name" | "mtime" | "ctime";
  fontsize: string;
  showtitle: boolean;
  debugquery: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  path: "",
  query: "",
  limit: 0,
  recursive: true,
  sort: "desc",
  sortby: "mtime",
  fontsize: "6pt",
  showtitle: true,
  debugquery: false,
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
    const error = "Cannot parse YAML!";
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
