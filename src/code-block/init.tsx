import { App, MarkdownRenderChild } from "obsidian";
import { StrictMode, useState } from "react";
import { createRoot, Root } from "react-dom/client";

import NoteGalleryPlugin from "../main";

const View = () => {
  const [v, setV] = useState(0);
  return (
    <div>
      <h1>Test {v}</h1>
      <button onClick={() => setV(v + 1)}>inc!</button>
    </div>
  );
};

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
        <View />
      </StrictMode>,
    );
  }

  async onunload() {
    this.root?.unmount();
  }
}
