import "obsidian";
import CodeMirror from "codemirror";

declare module "obsidian" {
  interface App {
    appId: string;
    loadLocalStorage: (key: string) => string | null;
    saveLocalStorage: (key: string, value: unknown) => void;
  }

  interface Editor {
    cm: CodeMirror.Editor;
  }
}
