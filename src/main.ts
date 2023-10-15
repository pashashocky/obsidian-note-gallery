import { Plugin } from "obsidian";
import { noteGalleryInit } from "./init";

import {
  parseLinktext,
  TFile,
  Workspace,
  WorkspaceLeaf,
  WorkspaceSplit,
  OpenViewState,
} from "obsidian";

export default class NoteGalleryPlugin extends Plugin {
  opening = false;

  document: Document = window.document;

  containerForDocument(doc: Document) {
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

  updateLeaves() {
    let leafCount = 0;
    this.app.workspace.iterateAllLeaves((leaf) => {
      leafCount++;
    });
  }

  attachLeaf(rootSplit: WorkspaceSplit, el: HTMLElement): WorkspaceLeaf {
    rootSplit.getRoot = () => app.workspace["rootSplit"]!;
    rootSplit.getContainer = () => this.containerForDocument(this.document);
    el.appendChild(rootSplit.containerEl);
    console.log("attachLeaf", { rootSplit: rootSplit });
    const leaf = this.app.workspace.createLeafInParent(rootSplit, 0);
    this.updateLeaves();
    return leaf;
  }

  async openFile(
    file: TFile,
    openState?: OpenViewState,
    useLeaf?: WorkspaceLeaf,
    rootSplit?: WorkspaceSplit,
    el?: HTMLElement
  ) {
    // if (this.detaching) return;
    const leaf = useLeaf ?? this.attachLeaf(rootSplit, el);
    console.log("openFile", { file, openState, useLeaf });
    this.opening = true;
    try {
      // await leaf.openFile(file, openState);
      // if (this.plugin.settings.autoFocus && !this.detaching) {
      //   this.whenShown(() => {
      //     // Don't set focus so as not to activate the Obsidian window during unfocused mouseover
      //     app.workspace.setActiveLeaf(leaf, false, false);
      //     // Set only the leaf focus, rather than global focus
      //     if (app.workspace.activeLeaf === leaf)
      //       leaf.setEphemeralState({ focus: true });
      //     // Prevent this leaf's file from registering as a recent file
      //     // (for the quick switcher or Recent Files plugin) for the next
      //     // 1ms.  (They're both triggered by a file-open event that happens
      //     // in a timeout 0ms after setActiveLeaf, so we register now and
      //     // uninstall later to ensure our uninstalls happen after the event.)
      //     setTimeout(
      //       around(Workspace.prototype, {
      //         recordMostRecentOpenedFile(old) {
      //           return function (_file: TFile) {
      //             // Don't update the quick switcher's recent list
      //             if (_file !== file) {
      //               return old.call(this, _file);
      //             }
      //           };
      //         },
      //       }),
      //       1,
      //     );
      //     const recentFiles =
      //       this.plugin.app.plugins.plugins["recent-files-obsidian"];
      //     if (recentFiles)
      //       setTimeout(
      //         around(recentFiles, {
      //           shouldAddFile(old) {
      //             return function (_file: TFile) {
      //               // Don't update the Recent Files plugin
      //               return _file !== file && old.call(this, _file);
      //             };
      //           },
      //         }),
      //         1,
      //       );
      //   });
      // } else if (!this.plugin.settings.autoFocus && !this.detaching) {
      //   const titleEl = this.hoverEl.querySelector(".popover-title");
      //   if (!titleEl) return;
      //   titleEl.textContent = leaf.view?.getDisplayText();
      //   titleEl.setAttribute("data-path", leaf.view?.file?.path);
      // }
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
    createInLeaf?: WorkspaceLeaf
  ) {
    const link = parseLinktext(file.path);
    console.log({ link, file });
    const parentMode = this.getDefaultMode();
    const state = this.buildState(parentMode);
    const leaf = await this.openFile(file, state, createInLeaf, rootSplit, el);
    const leafViewType = leaf?.view?.getViewType();
    console.log("openLink", { link, file, leaf, leafViewType });
    // if (leafViewType === "image") {
    //   // TODO: temporary workaround to prevent image popover from disappearing immediately when using live preview
    //   if (
    //     this.plugin.settings.autoFocus &&
    //     this.parent?.hasOwnProperty("editorEl") &&
    //     (this.parent as unknown as MarkdownEditView).editorEl!.hasClass(
    //       "is-live-preview",
    //     )
    //   ) {
    //     this.waitTime = 3000;
    //   }
    //   this.constrainAspectRatio = true;
    //   const img = leaf!.view.contentEl.querySelector("img")!;
    //   this.hoverEl.dataset.imgHeight = String(img.naturalHeight);
    //   this.hoverEl.dataset.imgWidth = String(img.naturalWidth);
    //   this.hoverEl.dataset.imgRatio = String(
    //     img.naturalWidth / img.naturalHeight,
    //   );
    // } else if (leafViewType === "pdf") {
    //   this.hoverEl.style.height = "800px";
    //   this.hoverEl.style.width = "600px";
    // }
    // if (state.state?.mode === "source")
    //   this.whenShown(() => {
    //     // Not sure why this is needed, but without it we get issue #186
    //     if (requireApiVersion("1.0")) (leaf?.view as any)?.editMode?.reinit?.();
    //     leaf?.view?.setEphemeralState(state.eState);
    //   });
  }
}
