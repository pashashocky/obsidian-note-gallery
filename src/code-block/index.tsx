import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TFile,
} from "obsidian";
import { render } from "preact";

import NoteGalleryPlugin from "~/main";
import NoteGalleryApp from "~/react";
import getFileList from "~/code-block/files";
import getSettings, { Settings } from "~/code-block/settings";

export default class CodeBlockNoteGallery extends MarkdownRenderChild {
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
    this.settings = getSettings(src, app, containerEl, ctx);
    this.files = getFileList(app, ctx, containerEl, this.settings);
  }

  async onload() {
    render(
      <NoteGalleryApp
        app={this.app}
        component={this}
        sourcePath={this.ctx.sourcePath}
        files={this.files}
        settings={this.settings}
      />,
      this.containerEl,
    );
  }

  async onunload() {
    render(null, this.containerEl);
  }
}
