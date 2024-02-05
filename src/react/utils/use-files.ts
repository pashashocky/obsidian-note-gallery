import {
  App,
  EmbeddedSearchDOMClass,
  FileStats,
  TAbstractFile,
  TFile,
  TFolder,
  Vault,
  debounce,
} from "obsidian";
import { useEffect, useState } from "preact/hooks";

import { Settings } from "~/code-block/settings";
import { Database } from "~/index/database";
import { dbHTMLEntry } from "~/main";
import { useAppMount } from "~/react/context/app-mount-provider";

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

const getFileList = (app: App, settings: Settings) => {
  // retrieve a list of files in the settings.path
  // and if specified by settings.recursive fetch the files
  // in all the subfolders.
  let error = null;
  const folder = getPath(app, settings.path);
  if (!(folder instanceof TFolder)) {
    if (settings.path && settings.path !== "")
      error = "The folder specified in `path` doesn't exist!";
    return { files: [], error };
  }
  return { files: getFilesRecursive(folder.children, settings.recursive), error };
};

const filterFileList = (
  files: TFile[],
  db: Database<dbHTMLEntry>,
  sourcePath: string,
  settings: Settings,
) => {
  const filteredFiles = files
    .filter(
      file => file.path !== sourcePath && VALID_EXTENSIONS.includes(file.extension),
    )
    // Prevent any have a `note-gallery` being rendered in the note-gallery
    // this will cause recursion issues and weird bugs...
    .filter(f => {
      if (f.extension !== "md") {
        return true;
      }
      const fileCache = db.getItem(f.path);
      if (!fileCache) return false;
      const { data } = fileCache;
      if (!data.markdown || !data.hasMarkdown) {
        return false;
      }
      // TODO: replace with global
      return !(
        data.markdown.contains("```note-gallery") ||
        data.markdown.contains("~~~note-gallery")
      );
    })
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
  return settings.limit === 0 ? filteredFiles : filteredFiles.splice(0, settings.limit);
};

const getSortOrder = (settings: Settings) => {
  const order = `${settings.sortby}:${settings.sort}`;
  switch (order) {
    case "mtime:desc":
      return "byModifiedTime";
    case "mtime:asc":
      return "byModifiedTimeReverse";
    case "ctime:desc":
      return "byCreatedTime";
    case "ctime:asc":
      return "byCreatedTimeReverse";
    case "name:desc":
      return "alphabeticalReverse";
    case "name:asc":
      return "alphabetical";
    default:
      return "byModifiedTime";
  }
};

const adjustStyle = (local: EmbeddedSearchDOMClass | undefined, settings: Settings) => {
  if (!local) return;
  if (settings.debugquery) {
    local.el.style.maxHeight = "300px";
    local.el.style.padding = "10px";
    local.el.style.marginBottom = "12px";
    local.el.style.border = "1px solid var(--background-modifier-border)";
    local.el.style.borderRadius = "5px";
  } else {
    local.el.style.height = "8px";
    // no need to keep the match divs around and grow the dom if we are not showing it
    const fc = local.el.firstChild;
    if (fc) fc.remove();
  }
  local.el.style.removeProperty("display");
};

export const useFiles = () => {
  const { app, db, sourcePath, settings, embeddedSearch } = useAppMount();
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<TFile[]>([]);

  // TODO: magic number to global constant
  const DEBOUNCE_TIMEOUT = 100;

  useEffect(() => {
    const reloadPathFiles = () => {
      const { files: newFiles, error } = getFileList(app, settings);
      if (error) {
        setError(error);
        return [];
      }
      return newFiles;
    };

    const reloadQueryFiles = (update: EmbeddedSearchDOMClass | undefined) => {
      const local = embeddedSearch?.dom;
      if (!local || !local.parent) return [];
      if (!update || !update.parent) return [];
      if (
        !update.parent.sourcePath ||
        update.parent.sourcePath !== local.parent.sourcePath
      )
        return [];

      const wantSort = getSortOrder(settings);
      if (local.setSortOrder && local.sortOrder !== wantSort)
        local.setSortOrder(wantSort);

      const resultDomLookup = update?.resultDomLookup
        ? update.resultDomLookup
        : local?.resultDomLookup;
      if (!resultDomLookup) return [];
      return Array.from(resultDomLookup.keys());
    };

    const reloadFiles = (
      update: EmbeddedSearchDOMClass | undefined,
      style?: boolean,
    ) => {
      if (style) adjustStyle(update, settings);
      // deduplicate by file.path, keeping the newest ones
      const allFiles = [...files, ...reloadPathFiles(), ...reloadQueryFiles(update)];
      const newFiles = [...new Map(allFiles.map(file => [file.path, file])).values()];
      const filteredFiles = filterFileList(newFiles, db, sourcePath, settings);
      if (filteredFiles.length) {
        setFiles(filteredFiles);
      }
    };
    if (!files.length) reloadFiles(embeddedSearch?.dom, true);

    const debouncedReloadFiles = debounce(reloadFiles, DEBOUNCE_TIMEOUT, true);
    const ready = () => debouncedReloadFiles(embeddedSearch?.dom, true);
    app.workspace.on("search:onChange", debouncedReloadFiles);
    db.on("database-update", ready);
    return () => {
      app.workspace.off("search:onChange", debouncedReloadFiles);
      db.off("database-update", ready);
    };
  });

  return { error, files };
};
