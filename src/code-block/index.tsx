import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TFile,
} from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import Masonry from "../masonry";

import NoteGalleryPlugin from "../main";
import getFileList from "./files";
import getSettings, { Settings } from "./settings";

const View = ({ app, files }: { app: App; files: TFile[] }) => {
  const breakpointColumnsObj = {
    default: 10,
    3100: 9,
    2700: 8,
    2300: 7,
    1900: 6,
    1500: 5,
    1000: 4,
    700: 3,
    400: 2,
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
    public ctx: MarkdownPostProcessorContext,
  ) {
    super(containerEl);
    this.root = null;
    this.settings = getSettings(src, app, containerEl, ctx);
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
