import { noteGalleryInit } from "./init";

import {
  Plugin,
  parseLinktext,
  TFile,
  WorkspaceLeaf,
  WorkspaceSplit,
  OpenViewState,
} from "obsidian";

export default class NoteGalleryPlugin extends Plugin {
  opening = false;

  document: Document = window.document;

  containerForDocument() {
    return app.workspace.rootSplit;
  }

  async onload() {
    this.registerMarkdownCodeBlockProcessor("note-gallery", (src, el, ctx) => {
      const handler = new noteGalleryInit(this, src, el, this.app);
      ctx.addChild(handler);
    });
  }

  onunload() {}

  getDefaultMode() {
    return "preview";
  }

  buildState(parentMode: string) {
    return {
      active: false, // Don't let Obsidian force focus if we have autofocus off
      state: { mode: parentMode },
    };
  }

  attachLeaf(rootSplit: WorkspaceSplit, el: HTMLElement): WorkspaceLeaf {
    rootSplit.getRoot = () => app.workspace["rootSplit"]!;
    rootSplit.getContainer = () => this.containerForDocument();
    el.appendChild(rootSplit.containerEl);
    console.log("attachLeaf", { rootSplit: rootSplit });
    const leaf = this.app.workspace.createLeafInParent(rootSplit, 0);
    return leaf;
  }

  async openFile(
    file: TFile,
    openState?: OpenViewState,
    useLeaf?: WorkspaceLeaf,
    rootSplit?: WorkspaceSplit,
    el?: HTMLElement,
  ) {
    // if (this.detaching) return;
    const leaf = useLeaf ?? this.attachLeaf(rootSplit, el);
    console.log("openFile", { file, openState, useLeaf });
    this.opening = true;
    try {
      // await leaf.openFile(file, openState);
      console.log("empty");
    } catch (e) {
      console.error(e);
    } finally {
      this.opening = false;
      console.log("openFile", { this: this, leaf });
      // if (this.detaching) this.hide();
    }
    return leaf;
  }

  async openLink(
    file: TFile,
    rootSplit: WorkspaceSplit,
    el: HTMLElement,
    createInLeaf?: WorkspaceLeaf,
  ) {
    const link = parseLinktext(file.path);
    console.log({ link, file });
    const parentMode = this.getDefaultMode();
    const state = this.buildState(parentMode);
    const leaf = await this.openFile(file, state, createInLeaf, rootSplit, el);
    const leafViewType = leaf?.view?.getViewType();
    console.log("openLink", { link, file, leaf, leafViewType });
  }
}
