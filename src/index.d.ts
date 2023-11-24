import CodeMirror from "codemirror";
import "obsidian";

declare module "obsidian" {
  interface App {
    appId: string;
    loadLocalStorage: (key: string) => string | null;
    saveLocalStorage: (key: string, value: unknown) => void;
  }

  interface Editor {
    cm: CodeMirror.Editor;
  }

  export interface Workspace extends Events {
    on(
      name: "search:onChange",
      callback: (embeddedSearchDOM: EmbeddedSearchDOMClass) => void,
      ctx?: unknown,
    ): EventRef;
  }

  class EmbeddedSearchClass extends MarkdownRenderChild {
    constructor(app: App, el: HTMLElement, query: string, sourcePath: string);
    dom?: EmbeddedSearchDOMClass;
    query: string;
    sourcePath: string;
    onunload(): void;
    onload(): void;
  }

  class EmbeddedSearchDOMClass {
    addResult(): void;
    changed(): void;
    children: SearchResultItemClass[];
    el: HTMLElement;
    emptyResults(): void;
    infinityScroll: InfinityScroll;
    onChange(): void;
    parent?: EmbeddedSearchClass;
    patched: boolean;
    removeResult(): void;
    resultDomLookup: Map<TFile, SearchResultItemClass>;
    setSortOrder(sortType: string): void;
    sortOrder: string;
    startLoader(): void;
    stopLoader(): void;
  }

  class SearchResultItemClass {
    renderContentMatches(): void;
    info: ItemInfo;
    collapsible: boolean;
    collpased: boolean;
    extraContext: boolean;
    showTitle: boolean;
    parent: SearchResultDOM;
    children: SearchResultItemMatch[];
    file: TFile;
    content: string;
    el: HTMLElement;
    pusherEl: HTMLElement;
    containerEl: HTMLElement;
    childrenEl: HTMLElement;
  }
}
