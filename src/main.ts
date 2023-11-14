import { EditorState } from "@codemirror/state";
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

export async function extractValue(
  markdown: string,
  _file: TFile,
  _state?: EditorState,
): Promise<dbHTMLEntry> {
  // the idea of the below is to trim the content to the first n linesToKeep
  const linesToKeep = 30;
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
    hasMarkdown: true,
    innerHTML: null,
    rendered: false,
  };
}

function loadValue(data: dbHTMLEntry): dbHTMLEntry {
  if (data.innerHTML || data.rendered) {
    data = { ...data, innerHTML: null, rendered: false };
  }
  return data;
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
      "Render Store",
      1,
      "Stores text and renderedHTML of a file to be rendered by the note gallery",
      () => DEFAULT_DB_ENTRY,
      extractValue,
      2,
      loadValue,
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
