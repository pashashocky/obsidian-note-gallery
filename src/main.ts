import { Plugin, TFile } from "obsidian";
import CodeBlockNoteGallery from "~/code-block";

import { Database } from "~/index/database";

export interface dbHTMLEntry {
  text: string | null;
  markdown: string | null;
  innerHTML: string | null;
  hasMarkdown: boolean;
  rendered: boolean;
}

const DEFAULT_DB_ENTRY: dbHTMLEntry = {
  text: null,
  markdown: null,
  innerHTML: null,
  hasMarkdown: false,
  rendered: false,
};

const linesToKeep = 30;
async function preCache(plugin: Plugin, file: TFile): Promise<dbHTMLEntry> {
  const { app } = plugin;
  const { vault } = app;
  let markdown = await vault.cachedRead(file);

  // the idea of the below is to trim the content to the first n linesToKeep
  let frontmatter = "";
  if (markdown.startsWith("---")) {
    const i = markdown.indexOf("---", 3); // second instance
    frontmatter = markdown.slice(0, i + 3).trim();
    markdown = markdown.slice(i + 3, markdown.length).trim();
  }
  const text = markdown.split("\n").slice(0, linesToKeep).join("\n");
  markdown = [frontmatter, text].join("\n").trim();
  return {
    text,
    markdown,
    innerHTML: null,
    hasMarkdown: true,
    rendered: false,
  };
}

async function removeRendered(
  _plugin: Plugin,
  _file: TFile,
  value: dbHTMLEntry,
): Promise<dbHTMLEntry | null> {
  if (value.innerHTML || value.rendered) {
    return { ...value, innerHTML: null, rendered: false };
  }
  return null;
}

export default class NoteGalleryPlugin extends Plugin {
  public db: Database<dbHTMLEntry>;
  /**
   * Called on plugin load.
   * This can be when the plugin is enabled or Obsidian is first opened.
   */
  async onload() {
    this.db = new Database(
      this,
      "note-gallery-render-store",
      "rendered markdown cache",
      1,
      "Stores rendered HTML of a file to be rendered by the note gallery",
      () => DEFAULT_DB_ENTRY,
      preCache,
      removeRendered,
    );
    this.registerMarkdownCodeBlockProcessor("note-gallery", (src, el, ctx) => {
      const handler = new CodeBlockNoteGallery(this, src, el, this.app, ctx);
      ctx.addChild(handler);
    });
  }

  /**
   * Called on plugin unload.
   * This can be when the plugin is disabled or Obsidian is closed.
   */
  async onunload() {}
}
