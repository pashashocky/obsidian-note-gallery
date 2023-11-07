import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TFile,
} from "obsidian";
import { createRoot, Root } from "react-dom/client";

import NoteGalleryPlugin from "~/main";
import NoteGalleryApp from "~/react";
import getFileList from "~/code-block/files";
import getSettings, { Settings } from "~/code-block/settings";

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
      <NoteGalleryApp
        app={this.app}
        component={this}
        sourcePath={this.ctx.sourcePath}
        files={this.files}
      />,
    );
  }

  async onunload() {
    this.root?.unmount();
  }
}
