import { App, Component, EmbeddedSearchClass } from "obsidian";
import { useEffect, useState } from "preact/hooks";

import AppMount from "~/react/context/app-mount-provider";
import Gallery from "~/react/components/Gallery";
import { Settings } from "~/code-block/settings";
import { Database } from "~/index/database";
import { dbHTMLEntry } from "~/main";

interface NoteGalleryAppProps {
  app: App;
  component: Component;
  containerEl: HTMLElement;
  sourcePath: string;
  settings: Settings;
  embeddedSearch: EmbeddedSearchClass;
  db: Database<dbHTMLEntry>;
}

export default function NoteGalleryApp({
  app,
  component,
  containerEl,
  sourcePath,
  settings,
  embeddedSearch,
  db,
}: NoteGalleryAppProps) {
  const [databaseReady, setDatabaseReady] = useState(false);
  useEffect(() => {
    containerEl.style.setProperty("--note-card-font-size", settings.fontsize);

    const ready = () => setDatabaseReady(true);
    if (db.ready) ready();
    db.on("database-update", ready);
    return () => {
      db.off("database-update", ready);
    };
  }, [db, settings.fontsize, containerEl]);

  return (
    <AppMount
      app={app}
      component={component}
      sourcePath={sourcePath}
      db={db}
      embeddedSearch={embeddedSearch}
      settings={settings}
    >
      {!databaseReady && (
        <div>
          <h1>Note Gallery: Loading...</h1>
        </div>
      )}
      {databaseReady && <Gallery />}
    </AppMount>
  );
}
