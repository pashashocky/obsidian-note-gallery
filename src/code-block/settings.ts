import { App, MarkdownPostProcessorContext, normalizePath, parseYaml } from "obsidian";
import renderError from "~/code-block/errors";

export interface Settings {
  path: string;
  limit: number;
  recursive: boolean;
  sort: "asc" | "desc";
  sortby: "name" | "mtime" | "ctime";
}

const DEFAULT_SETTINGS: Settings = {
  path: "",
  limit: 0,
  recursive: true,
  sort: "desc",
  sortby: "mtime",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = { [key: string]: any };
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
  let settingsSrc: AnyObject = parseYaml(src);
  if (settingsSrc === undefined) {
    const error = "Cannot parse YAML!";
    renderError(container, error);
    throw new Error(error);
  }

  if (settingsSrc !== null) {
    settingsSrc = lowercaseKeys(settingsSrc);
  }

  const settings = DEFAULT_SETTINGS;
  if (settingsSrc === null || !settingsSrc.path) {
    const file = app.vault.getAbstractFileByPath(ctx.sourcePath)!.parent!;
    settings.path = file.path;
  } else {
    settings.path = settingsSrc.path;
  }
  settings.path = normalizePath(settings.path);
  settings.limit = settingsSrc?.limit ?? settings.limit;
  settings.recursive = settingsSrc?.recursive ?? settings.recursive;
  settings.sort = settingsSrc?.sort ?? settings.sort;
  settings.sortby = settingsSrc?.sortby ?? settings.sortby;

  return settings;
};

export default getSettings;
