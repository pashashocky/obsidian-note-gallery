import { Plugin } from "obsidian";
import CodeBlockNoteGallery from "./code-block";

export default class NoteGalleryPlugin extends Plugin {
  /**
   * Called on plugin load.
   * This can be when the plugin is enabled or Obsidian is first opened.
   */
  async onload() {
    this.registerMarkdownCodeBlockProcessor("note-gallery", (src, el, ctx) => {
      const handler = new CodeBlockNoteGallery(this, src, el, this.app);
      ctx.addChild(handler);
    });
  }

  /**
   * Called on plugin unload.
   * This can be when the plugin is disabled or Obsidian is closed.
   */
  async onunload() {}
}
