import { StrictMode } from "preact/compat";
import { useEffect } from "preact/hooks";

import AppMount from "~/react/context/app-mount-provider";
import Gallery from "~/react/components/Gallery";
import { App, Component, TFile } from "obsidian";
import { Settings } from "~/code-block/settings";
import localforage from "localforage";

interface NoteGalleryAppProps {
  app: App;
  component: Component;
  sourcePath: string;
  settings: Settings;
  files: TFile[];
  cache: typeof localforage;
}

export default function NoteGalleryApp({
  app,
  component,
  sourcePath,
  files,
  settings,
  cache,
}: NoteGalleryAppProps) {
  useEffect(() => {
    (async () => {
      const keys = await cache.keys();
      const c = await Promise.all(
        keys.map(key => cache.getItem(key) as Promise<string>),
      );
      console.log({ c });
    })();

    document.documentElement.style.setProperty(
      "--note-card-font-size",
      settings.fontsize,
    );
  });
  return (
    <StrictMode>
      <AppMount app={app} component={component} sourcePath={sourcePath} cache={cache}>
        <Gallery files={files} />
      </AppMount>
    </StrictMode>
  );
}
