import { TAbstractFile, TFile, Workspace, WorkspaceSplit } from "obsidian";
import NoteGalleryPlugin from "./main";

type ConstructableWorkspaceSplit = new (
  ws: Workspace,
  dir: "horizontal" | "vertical"
) => WorkspaceSplit;

const buildVertical = (
  plugin: NoteGalleryPlugin,
  container: HTMLElement,
  filesList: { [key: string]: any },
  settings: { [key: string]: any }
) => {
  // inject the gallery wrapper
  const gallery = container.createEl("div");
  gallery.addClass("grid-wrapper");
  gallery.style.lineHeight = "0px";
  gallery.style.columnCount = `${settings.columns}`;
  gallery.style.columnGap = `${settings.gutter}px`;

  console.log({ filesList });
  // inject and style files
  filesList.forEach((file: TFile) => {
    const figure = gallery.createDiv("grid-item");
    figure.style.marginBottom = `${settings.gutter}px`;
    // figure.style.width = "100%";
    figure.style.height = "auto";
    figure.style.cursor = "pointer";
    figure.setAttribute("data-name", file.name);
    figure.setAttribute("data-folder", file.name);

    const c = figure.createDiv("grid-content");

    const rootSplit: WorkspaceSplit =
      new (WorkspaceSplit as ConstructableWorkspaceSplit)(
        window.app.workspace,
        "vertical"
      );

    plugin.openLink(file, rootSplit, c);

    const img = figure.createEl("img");
    img.style.borderRadius = `${settings.radius}px`;
  });

  return gallery;
};

export default buildVertical;
