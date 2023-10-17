import { App, TFolder, TFile, FileStats } from "obsidian";
import { Settings } from "./get-settings";
import renderError from "./render-error";

const getFileList = (app: App, container: HTMLElement, settings: Settings) => {
  // retrieve a list of the files
  const folder = app.vault.getAbstractFileByPath(settings.path);
  let files;
  if (folder instanceof TFolder) {
    files = folder.children;
  } else {
    const error = "The folder doesn't exist, or it's empty!";
    renderError(container, error);
    throw new Error(error);
  }

  // filter the list of files to make sure we're dealing with .md only
  // const validExtensions = ["md"];
  const validExtensions = ["jpeg", "jpg", "gif", "png", "webp", "tiff", "tif"];
  files = files.filter(file => {
    if (file instanceof TFile && validExtensions.includes(file.extension)) return file;
  }) as Array<TFile>;

  // sort the list by mtime, or ctime
  files = files.sort((a: TFile, b: TFile) => {
    const refA = settings.sortby === "name" ? a["name"].toUpperCase() : a.stat[settings.sortby as keyof FileStats];
    const refB = settings.sortby === "name" ? b["name"].toUpperCase() : b.stat[settings.sortby as keyof FileStats];
    return refA < refB ? -1 : refA > refB ? 1 : 0;
  });

  // re-sort again by ascending or descending order
  files = settings.sort === "asc" ? files : files.reverse();

  // return an array of objects
  return files;
};

export default getFileList;
