import {
  App,
  TFolder,
  TFile,
  FileStats,
  TAbstractFile,
  Vault,
  MarkdownPostProcessorContext,
} from "obsidian";
import { Settings } from "~/code-block/settings";
import renderError from "~/code-block/errors";

type InsensitiveVault = Vault & {
  getAbstractFileByPathInsensitive?: null | ((path: string) => TAbstractFile | null);
};

const VALID_EXTENSIONS = ["jpeg", "jpg", "gif", "png", "webp", "tiff", "tif", "md"];

const getFilesRecursive = (files: TAbstractFile[], recursive = false) =>
  files.reduce((children, abstractFile) => {
    if (recursive && abstractFile instanceof TFolder) {
      children = children.concat(getFilesRecursive(abstractFile.children, true));
    } else if (abstractFile instanceof TFile) {
      children.push(abstractFile);
    }
    return children;
  }, [] as Array<TFile>);

const getPath = (app: App, path: string) => {
  const { vault } = app;
  const iVault: InsensitiveVault = vault;
  if (iVault.getAbstractFileByPathInsensitive) {
    return iVault.getAbstractFileByPathInsensitive(path);
  }
  return vault.getAbstractFileByPath(path);
};

const getFileList = (
  app: App,
  ctx: MarkdownPostProcessorContext,
  container: HTMLElement,
  settings: Settings,
) => {
  // retrieve a list of files in the settings.path
  // and if specified by settings.recursive fetch the files
  // in all the subfolders.
  const folder = getPath(app, settings.path);
  if (!(folder instanceof TFolder)) {
    const error = "The folder doesn't exist, or is empty!";
    renderError(container, error);
    throw new Error(error);
  }
  const files = getFilesRecursive(folder.children, settings.recursive)
    .filter(
      file => file.path !== ctx.sourcePath && VALID_EXTENSIONS.includes(file.extension),
    )
    .sort((a: TFile, b: TFile) => {
      const refA =
        settings.sortby === "name"
          ? a["name"].toUpperCase()
          : a.stat[settings.sortby as keyof FileStats];
      const refB =
        settings.sortby === "name"
          ? b["name"].toUpperCase()
          : b.stat[settings.sortby as keyof FileStats];
      const sort = settings.sort === "asc" ? -1 : 1;
      return refA < refB ? sort : refA > refB ? sort * -1 : 0;
    });
  return settings.limit === 0 ? files : files.splice(0, settings.limit);
};

export default getFileList;
