import { StrictMode } from "preact/compat";
import { useEffect } from "preact/hooks";

import AppMount from "~/react/context/app-mount-provider";
import Gallery from "~/react/components/Gallery";
import { App, Component, TFile } from "obsidian";
import { Settings } from "~/code-block/settings";
import { Database } from "~/index/database";
import { dbHTMLEntry } from "~/main";

interface NoteGalleryAppProps {
  app: App;
  component: Component;
  sourcePath: string;
  settings: Settings;
  files: TFile[];
  db: Database<dbHTMLEntry>;
}

export default function NoteGalleryApp({
  app,
  component,
  sourcePath,
  files,
  settings,
  db,
}: NoteGalleryAppProps) {
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--note-card-font-size",
      settings.fontsize,
    );
  });
  return (
    <StrictMode>
      <AppMount app={app} component={component} sourcePath={sourcePath} db={db}>
        <Gallery files={files} />
      </AppMount>
    </StrictMode>
  );
}
