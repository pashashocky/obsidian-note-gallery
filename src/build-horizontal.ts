import NoteGalleryPlugin from "./main";
import {
  parseLinktext,
  TFile,
  Workspace,
  WorkspaceLeaf,
  WorkspaceSplit,
  OpenViewState,
} from "obsidian";

type ConstructableWorkspaceSplit = new (
  ws: Workspace,
  dir: "horizontal" | "vertical"
) => WorkspaceSplit;

const buildHorizontal = (
  plugin: NoteGalleryPlugin,
  container: HTMLElement,
  filesList: { [key: string]: any },
  settings: { [key: string]: any }
) => {
  // inject the gallery wrapper
  const gallery = container.createEl("div");
  gallery.addClass("grid-wrapper");
  gallery.style.display = "flex";
  gallery.style.flexWrap = "wrap";
  gallery.style.marginRight = `-${settings.gutter}px`;

  // inject and style images
  filesList.slice(0, 4).forEach((file: TFile) => {
    const figure = gallery.createEl("figure");
    figure.addClass("grid-item");
    figure.style.margin = `0px ${settings.gutter}px ${settings.gutter}px 0px`;
    figure.style.width = "auto";
    figure.style.height = `${settings.height}px`;
    figure.style.borderRadius = `${settings.radius}px`;
    figure.style.flex = "1 0 auto";
    figure.style.overflow = "hidden";
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

    // const img = figure.createEl("img");
    // img.style.objectFit = "cover";
    // img.style.width = "100%";
    // img.style.height = "100%";
    // img.style.borderRadius = "0px";
  });

  return gallery;
};

export default buildHorizontal;
