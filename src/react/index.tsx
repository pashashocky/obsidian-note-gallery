import { StrictMode } from "preact/compat";
import { useEffect } from "preact/hooks";

import AppMount from "~/react/context/app-mount-provider";
import Gallery from "~/react/components/Gallery";
import { App, Component, TFile } from "obsidian";
import { Settings } from "~/code-block/settings";

interface NoteGalleryAppProps {
  app: App;
  component: Component;
  sourcePath: string;
  settings: Settings;
  files: TFile[];
}

export default function NoteGalleryApp({
  app,
  component,
  sourcePath,
  files,
  settings,
}: NoteGalleryAppProps) {
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--note-card-font-size",
      settings.fontsize,
    );
  });
  return (
    <StrictMode>
      <AppMount app={app} component={component} sourcePath={sourcePath}>
        <Gallery files={files} />
      </AppMount>
    </StrictMode>
  );
}
