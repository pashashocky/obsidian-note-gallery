import { App, TFolder, TFile, FileStats, TAbstractFile, Vault } from "obsidian";
import { useEffect, useState } from "preact/hooks";

import { Settings } from "~/code-block/settings";
import { useAppMount } from "../context/app-mount-provider";

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

const getFileList = (app: App, sourcePath: string, settings: Settings) => {
  // retrieve a list of files in the settings.path
  // and if specified by settings.recursive fetch the files
  // in all the subfolders.
  const folder = getPath(app, settings.path);
  if (!(folder instanceof TFolder)) {
    const error = "The folder doesn't exist, or is empty!";
    return { files: [], error };
  }
  const files = getFilesRecursive(folder.children, settings.recursive)
    .filter(
      file => file.path !== sourcePath && VALID_EXTENSIONS.includes(file.extension),
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
  return {
    files: settings.limit === 0 ? files : files.splice(0, settings.limit),
    error: null,
  };
};

export const useFiles = () => {
  const { app, sourcePath, settings } = useAppMount();
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<TFile[]>([]);

  useEffect(() => {
    const reloadFiles = () => {
      const { files, error } = getFileList(app, sourcePath, settings);
      setError(error);
      setFiles(files);
    };
    if (!files.length) reloadFiles();

    const reload = () => reloadFiles();
    app.vault.on("modify", reload);
    app.vault.on("create", reload);
    app.vault.on("delete", reload);
    app.vault.on("rename", reload);
    return () => {
      app.vault.off("modify", reload);
      app.vault.off("create", reload);
      app.vault.off("delete", reload);
      app.vault.off("rename", reload);
    };
  }, [app, sourcePath, settings, files.length]);

  return { error, files };
};
