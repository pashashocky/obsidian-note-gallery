import { App, MarkdownRenderChild } from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

import NoteGalleryPlugin from "../main";

export default class CodeBlockNoteGallery extends MarkdownRenderChild {
  private root: Root | null;

  constructor(
    public plugin: NoteGalleryPlugin,
    public src: string,
    public containerEl: HTMLElement,
    public app: App,
  ) {
    super(containerEl);
    this.root = null;
  }

  async onload() {
    this.root = createRoot(this.containerEl);
    this.root.render(
      <StrictMode>
        <h1>Test</h1>
      </StrictMode>,
    );
  }

  async onunload() {
    this.root?.unmount();
  }
}
