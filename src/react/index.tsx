import { StrictMode } from "react";

import AppMount from "~/react/context/app-mount-provider";
import Gallery from "~/react/components/Gallery";
import { App, Component, TFile } from "obsidian";

interface NoteGalleryAppProps {
  app: App;
  component: Component;
  sourcePath: string;
  files: TFile[];
}

export default function NoteGalleryApp({
  app,
  component,
  sourcePath,
  files,
}: NoteGalleryAppProps) {
  return (
    <StrictMode>
      <AppMount app={app} component={component} sourcePath={sourcePath}>
        <Gallery files={files} />
      </AppMount>
    </StrictMode>
  );
}
