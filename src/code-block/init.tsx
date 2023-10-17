import { App, MarkdownRenderChild, TFile } from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import Masonry from "react-masonry-css";

import NoteGalleryPlugin from "../main";
import getFileList from "./get-file-list";
import getSettings, { Settings } from "./get-settings";

const View = ({ app, files }: { app: App; files: TFile[] }) => {
  const breakpointColumnsObj = {
    default: 10,
    3100: 8,
    2700: 7,
    2300: 6,
    1900: 5,
    1500: 4,
    1000: 3,
    700: 2,
    500: 1,
  };
  return (
    <div>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {files.map(function (file) {
          return (
            <div key={file.name}>
              <img src={app.vault.adapter.getResourcePath(file.path)} />
            </div>
          );
        })}
      </Masonry>
    </div>
  );
};

export default class CodeBlockNoteGallery extends MarkdownRenderChild {
  private root: Root | null;
  private settings: Settings;
  private files: TFile[];

  constructor(
    public plugin: NoteGalleryPlugin,
    public src: string,
    public containerEl: HTMLElement,
    public app: App,
  ) {
    super(containerEl);
    this.root = null;
    this.settings = getSettings(src, containerEl);
    this.files = getFileList(app, containerEl, this.settings);
  }

  async onload() {
    this.root = createRoot(this.containerEl);
    this.root.render(
      <StrictMode>
        <View app={this.app} files={this.files} />
      </StrictMode>,
    );
  }

  async onunload() {
    this.root?.unmount();
  }
}
