import { App, MarkdownRenderChild } from "obsidian";
import NoteGalleryPlugin from "./main";
import getFileList from "./get-file-list";
import getSettings from "./get-settings";
import buildHorizontal from "./build-horizontal";
import buildVertical from "./build-vertical";

export class noteGalleryInit extends MarkdownRenderChild {
  private _gallery: HTMLElement = null;
  private _settings: { [key: string]: any } = {};
  private _fileList: { [key: string]: any } = {};

  constructor(
    public plugin: NoteGalleryPlugin,
    public src: string,
    public container: HTMLElement,
    public app: App
  ) {
    super(container);
  }

  async onload() {
    // parse and normalize settings
    this._settings = getSettings(this.src, this.container);
    this._fileList = getFileList(this.app, this.container, this._settings);

    // inject the pertinent kind of gallery
    if (this._settings.type === "horizontal") {
      this._gallery = buildHorizontal(
        this.plugin,
        this.container,
        this._fileList,
        this._settings
      );
    } else if (this._settings.type === "vertical") {
      this._gallery = buildVertical(
        this.plugin,
        this.container,
        this._fileList,
        this._settings
      );
    }
  }

  async onunload() {
    // destroy the gallery
    if (this._gallery) {
      this._gallery.remove();
      this._gallery = null;
    }
  }
}
