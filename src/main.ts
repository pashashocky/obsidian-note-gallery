import { EditorState } from "@codemirror/state";
import { around } from "monkey-around";
import {
  Component,
  EmbeddedSearchClass,
  EmbeddedSearchDOMClass,
  MarkdownView,
  Plugin,
  TFile,
  Workspace,
  WorkspaceLeaf,
  WorkspaceSplit,
} from "obsidian";

import CodeBlockNoteGallery from "~/code-block";
import { Database } from "~/index/database";

type ConstructableWorkspaceSplit = new (
  ws: Workspace,
  dir: "horizontal" | "vertical",
) => WorkspaceSplit;

export interface dbHTMLEntry {
  text: string | null;
  textMobile: string | null;
  markdown: string | null;
  markdownMobile: string | null;
  innerHTML: string | null;
  hasMarkdown: boolean;
  rendered: boolean;
}

const DEFAULT_DB_ENTRY: dbHTMLEntry = {
  text: null,
  textMobile: null,
  markdown: null,
  markdownMobile: null,
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
  const linesToKeep = 200;
  const linesToKeepMobile = 30;
  let frontmatter = "";
  if (markdown.startsWith("---")) {
    const i = markdown.indexOf("---", 3); // second instance
    frontmatter = markdown.slice(0, i + 3).trim();
    markdown = markdown.slice(i + 3, markdown.length).trim();
  }
  const text = markdown.split("\n").slice(0, linesToKeep).join("\n");
  const textMobile = markdown.split("\n").slice(0, linesToKeepMobile).join("\n");
  markdown = [frontmatter, text].join("\n").trim();
  const markdownMobile = [frontmatter, textMobile].join("\n").trim();
  return {
    text,
    textMobile,
    markdown,
    markdownMobile,
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
  public EmbeddedSearchLeafInitializer: WorkspaceLeaf | null = null;
  public EmbeddedSearch: typeof EmbeddedSearchClass | null = null;
  public isEmbeddedSearchPatched = false;
  public db: Database<dbHTMLEntry>;

  /**
   * Called on plugin load.
   * This can be when the plugin is enabled or Obsidian is first opened.
   */
  async onload() {
    this.db = this.registerDb();
    this.patchCatchEmbeddedSearch();

    this.registerMarkdownCodeBlockProcessor("note-gallery", async (src, el, ctx) => {
      const handler = new CodeBlockNoteGallery(this, src, el, this.app, ctx);
      ctx.addChild(handler);
    });

    this.addCommand({
      id: "drop-database",
      name: "Drop all cache and re-initialize database",
      callback: () => {
        this.db.reinitializeDatabase();
      },
    });
  }

  /**
   * Called on plugin unload.
   * This can be when the plugin is disabled or Obsidian is closed.
   */
  async onunload() {}

  registerDb() {
    return new Database(
      this,
      "render-store",
      "Render Store",
      6,
      "Stores text and renderedHTML of a file to be rendered by the note gallery",
      () => DEFAULT_DB_ENTRY,
      extractValue,
      2,
      loadValue,
    );
  }

  patchCatchEmbeddedSearch() {
    // The only way to obtain the EmbeddedSearch class is to catch it while it's being added to a parent component
    // The following will patch Component.addChild and will remove itself once it finds and patches EmbeddedSearch
    const plugin = this;
    plugin.register(
      around(Component.prototype, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addChild(old: any) {
          return function (this: Component, child: unknown, ...args: never[]) {
            try {
              if (
                child instanceof Component &&
                child.hasOwnProperty("searchQuery") &&
                child.hasOwnProperty("sourcePath") &&
                child.hasOwnProperty("dom")
              ) {
                const embeddedSearch = child as EmbeddedSearchClass;
                if (!plugin.EmbeddedSearch) {
                  plugin.EmbeddedSearch =
                    embeddedSearch.constructor as typeof EmbeddedSearchClass;
                  plugin.app.workspace.trigger(
                    "catchEmbeddedSearch",
                    embeddedSearch.constructor,
                  );
                }
                if (plugin.EmbeddedSearchLeafInitializer) {
                  setTimeout(() => {
                    plugin.EmbeddedSearchLeafInitializer?.detach();
                    plugin.EmbeddedSearchLeafInitializer = null;
                  }, 100);
                }
                if (!plugin.isEmbeddedSearchPatched) {
                  plugin.patchEmbeddedSearch(embeddedSearch);
                  plugin.isEmbeddedSearchPatched = true;
                }
              }
            } catch (err) {
              console.log({ type: "Patching CatchEmbeddedSearch Error", err });
            }
            const result = old.call(this, child, ...args);
            return result;
          };
        },
      }),
    );
  }

  patchEmbeddedSearch(embeddedSearch: EmbeddedSearchClass) {
    const plugin = this;
    const EmbeddedSearchDOM = embeddedSearch.dom!
      .constructor as typeof EmbeddedSearchDOMClass;

    this.register(
      around(embeddedSearch.constructor.prototype, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onload(old: any) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return function (this: EmbeddedSearchClass, ...args: any[]) {
            try {
              if (this.dom) this.dom.parent = this;
            } catch (err) {
              console.log({ type: "Patching EmbeddedSearch Error", err });
            }
            return old.call(this, ...args);
          };
        },
      }),
    );

    plugin.patchEmbeddedSearchDOM(EmbeddedSearchDOM);
  }

  patchEmbeddedSearchDOM(EmbeddedSearchDOM: typeof EmbeddedSearchDOMClass) {
    const plugin = this;
    plugin.register(
      around(EmbeddedSearchDOM.prototype, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        startLoader(old: any) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return function (this: EmbeddedSearchDOMClass, ...args: any[]) {
            try {
              // are we in a embedded search view?
              if (
                !this.patched &&
                this.el.parentElement?.hasClass("block-language-note-gallery") &&
                this.el?.closest(".block-language-note-gallery")
              ) {
                this.patched = true;
                this.setSortOrder = (sortType: string) => {
                  console.log(
                    `Note Gallery: Setting native search sort order ${sortType}`,
                  );
                  this.sortOrder = sortType;
                  this.changed();
                  this.infinityScroll.invalidateAll();
                };
              }
            } catch (err) {
              console.log({
                type: "Patching EmbeddedSearchDOM.startLoader Error",
                err,
              });
            }
            return old.call(this, ...args);
          };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addResult(old: any) {
          return function (
            this: EmbeddedSearchDOMClass,
            matchedFile: TFile,
            matchLoc: number[][],
            matchText: string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...args: any[]
          ) {
            let result;
            if (matchText.contains("note-gallery")) {
              // needed to prevent recursion of rendering the note-gallery code block
              // inside any native search results
              result = old.call(
                this,
                matchedFile,
                matchLoc,
                matchText.replace(
                  "note-gallery",
                  "note-gallery".toUpperCase().replace("-", "_"),
                ),
                ...args,
              );
              return result;
            } else result = old.call(this, matchedFile, matchLoc, matchText, ...args);
            return result;
          };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(old: any) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return function (this: EmbeddedSearchDOMClass, ...args: any[]) {
            try {
              plugin.app.workspace.trigger("search:onChange", this);
            } catch (err) {
              console.log({ type: "Patching EmbeddedSearchDOM.onChange Error", err });
            }
            return old.call(this, ...args);
          };
        },
      }),
    );
  }

  async triggerEmbeddedSearchPatch() {
    const rootSplit: WorkspaceSplit =
      new (WorkspaceSplit as ConstructableWorkspaceSplit)(
        this.app.workspace,
        "vertical",
      );
    const leaf = (this.EmbeddedSearchLeafInitializer = this.attachLeaf(rootSplit));
    const textFile = new MarkdownView(leaf);
    textFile.setViewData("```query\n```", true);
    await leaf.open(textFile);
    const viewState = leaf.getViewState();
    viewState.state.source = false;
    leaf.setViewState(viewState);
  }

  attachLeaf(rootSplit: WorkspaceSplit): WorkspaceLeaf {
    rootSplit.getRoot = () => this.app.workspace["rootSplit"]!;
    rootSplit.getContainer = () => this.app.workspace.rootSplit;
    return this.app.workspace.createLeafInParent(rootSplit, 0);
  }
}
