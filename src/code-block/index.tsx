import { App, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { render } from "preact";

import NoteGalleryPlugin from "~/main";
import NoteGalleryApp from "~/react";
import getSettings, { Settings } from "~/code-block/settings";

export default class CodeBlockNoteGallery extends MarkdownRenderChild {
  private settings: Settings;

  constructor(
    public plugin: NoteGalleryPlugin,
    public src: string,
    public containerEl: HTMLElement,
    public app: App,
    public ctx: MarkdownPostProcessorContext,
  ) {
    super(containerEl);
    this.settings = getSettings(src, app, containerEl, ctx);
  }

  async onload() {
    render(
      <NoteGalleryApp
        app={this.app}
        component={this}
        containerEl={this.containerEl}
        sourcePath={this.ctx.sourcePath}
        settings={this.settings}
        db={this.plugin.db}
      />,
      this.containerEl,
    );
  }

  async onunload() {
    render(null, this.containerEl);
  }
}
