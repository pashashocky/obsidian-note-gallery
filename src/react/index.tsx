import { useEffect, useState } from "preact/hooks";

import AppMount from "~/react/context/app-mount-provider";
import Gallery from "~/react/components/Gallery";
import { App, Component, TFile } from "obsidian";
import { Settings } from "~/code-block/settings";
import { Database } from "~/index/database";
import { dbHTMLEntry } from "~/main";

interface NoteGalleryAppProps {
  app: App;
  component: Component;
  containerEl: HTMLElement;
  sourcePath: string;
  settings: Settings;
  files: TFile[];
  db: Database<dbHTMLEntry>;
}

export default function NoteGalleryApp({
  app,
  component,
  containerEl,
  sourcePath,
  files,
  settings,
  db,
}: NoteGalleryAppProps) {
  const [databaseReady, setDatabaseReady] = useState(false);
  useEffect(() => {
    containerEl.style.setProperty("--note-card-font-size", settings.fontsize);

    console.log({ items: db.allItems() });
    if (db.ready) setDatabaseReady(true);
    db.on("database-update", () => setDatabaseReady(true));
    return () => {
      db.off("database-ready", () => setDatabaseReady(true));
    };
  }, [db, settings.fontsize, containerEl]);
  return (
    <AppMount app={app} component={component} sourcePath={sourcePath} db={db}>
      {!databaseReady && (
        <div>
          <h1>LOADING {databaseReady}</h1>
        </div>
      )}
      {databaseReady && <Gallery files={files} />}
    </AppMount>
  );
}
