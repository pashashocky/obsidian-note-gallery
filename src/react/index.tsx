import { StrictMode } from "preact/compat";
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
  const [databaseReady, setDatabaseReady] = useState(false);
  useEffect(() => {
    // TODO: test this works for multiple instances of code block
    // should maybe be containerEl
    document.documentElement.style.setProperty(
      "--note-card-font-size",
      settings.fontsize,
    );

    if (db.ready) setDatabaseReady(true);
    db.on("database-update", () => setDatabaseReady(true));
    return () => {
      db.off("database-ready", () => setDatabaseReady(true));
    };
  }, [db, app, settings.fontsize]);
  return (
    <StrictMode>
      <AppMount app={app} component={component} sourcePath={sourcePath} db={db}>
        {!databaseReady && (
          <div>
            <h1>LOADING {databaseReady}</h1>
          </div>
        )}
        {databaseReady && <Gallery files={files} />}
      </AppMount>
    </StrictMode>
  );
}
