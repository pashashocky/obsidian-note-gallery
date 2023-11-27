import { App, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import { render } from "preact";

import NoteGalleryPlugin from "~/main";
import NoteGalleryApp from "~/react";
import getSettings, { Settings } from "~/code-block/settings";

export default class CodeBlockNoteGallery extends MarkdownRenderChild {
  private settings: Settings;
  private reactEl: HTMLElement;
  private searchEl: HTMLElement;

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
    this.searchEl = this.containerEl.createEl("div");
    this.reactEl = this.containerEl.createEl("div");

    this.searchEl.style.display = "none";
    this.searchEl.style.overflowY = "scroll";

    if (!this.plugin.EmbeddedSearch) await this.plugin.triggerEmbeddedSearchPatch();
    render(
      <NoteGalleryApp
        app={this.app}
        plugin={this.plugin}
        component={this}
        containerEl={this.reactEl}
        searchEl={this.searchEl}
        sourcePath={this.ctx.sourcePath}
        settings={this.settings}
        db={this.plugin.db}
      />,
      this.reactEl,
    );
  }

  async onunload() {
    render(null, this.reactEl);
  }
}
