import localforage from "localforage";
import { EditorState } from "@codemirror/state";
import { debounce, EventRef, Events, Plugin, Notice, TFile } from "obsidian";
import { extendPrototype as extendPrototypeGet } from "localforage-getitems";
import { extendPrototype as extendPrototypeSet } from "localforage-setitems";

extendPrototypeSet(localforage);
extendPrototypeGet(localforage);

export type DatabaseItem<T> = { data: T; mtime: number };
export type DatabaseEntry<T> = [string, DatabaseItem<T>];

type MemoryDatabaseItem<T> = { data: T; mtime: number; dirty?: boolean };

export class EventComponent extends Events {
  _events: (() => void)[] = [];

  onunload() {}

  unload() {
    while (this._events.length > 0) {
      this._events.pop()!();
    }
  }

  register(event_unload: () => void) {
    this._events.push(event_unload);
  }

  registerEvent(event: EventRef) {
    // @ts-ignore (Eventref contains reference to the Events object it was attached to)
    this.register(() => event.e.offref(event));
  }
}

/**
 * Generic database class for storing data in indexedDB, automatically updates on file changes
 */
export class Database<T> extends EventComponent {
  /**
   * In-memory cache of the database
   */
  memory: Map<string, MemoryDatabaseItem<T>> = new Map();

  /**
   * IndexedDB instance for persisting data
   */
  persist: typeof localforage;

  /**
   * List of keys that have been deleted from the in-memory cache, but not yet from indexedDB
   * @private
   */
  private deleted_keys: Set<string> = new Set();

  public ready = false;

  /**
   * Trigger database update after a short delay, also trigger database flush after a longer delay
   */
  databaseUpdate = debounce(
    () => {
      this.trigger("database-update", this.allEntries());
      this.flushChanges();
    },
    100,
    true,
  );

  /**
   * Flush changes of memory database to indexedDB buffer
   */
  flushChanges = debounce(
    async () => {
      await this.persistMemory();
      this.trigger("database-update", this.allEntries());
    },
    1000,
    true,
  );

  public on(
    name: "database-update" | "database-create",
    callback: (update: DatabaseEntry<T>[]) => void,
    ctx?: unknown,
  ): EventRef;
  public on(name: "database-migrate", callback: () => void, ctx?: unknown): EventRef;

  on(name: string, callback: (...args: never[]) => void, ctx?: unknown): EventRef {
    return super.on(name, callback, ctx);
  }

  /**
   * Constructor for the database
   * @param plugin The plugin that owns the database
   * @param name Name of the database within indexedDB
   * @param title Title of the database
   * @param version Version of the database
   * @param description Description of the database
   * @param defaultValue Constructor for the default value of the database
   * @param extractValue Provide new values for database on file modification
   * @param workers Number of workers to use for parsing files
   * @param loadValue On loading value from indexedDB, run this function on the value (useful for re-adding prototypes)
   */
  constructor(
    public plugin: Plugin,
    public name: string,
    public title: string,
    public version: number,
    public description: string,
    private defaultValue: () => T,
    private extractValue: (
      markdown: string,
      file: TFile,
      state?: EditorState,
    ) => Promise<T>,
    public workers: number = 2,
    private loadValue: (data: T) => T = (data: T) => data,
  ) {
    super();

    // localforage does not offer a method for accessing the database version, so we store it separately
    const localStorageVersion = this.plugin.app.loadLocalStorage(name + "-version");
    const oldVersion = localStorageVersion ? parseInt(localStorageVersion) : null;

    this.persist = localforage.createInstance({
      name: this.name + `/${this.plugin.app.appId}`,
      driver: localforage.INDEXEDDB,
      description,
      version,
    });

    this.plugin.app.workspace.onLayoutReady(async () => {
      await this.persist.ready(async () => {
        await this.loadDatabase();

        this.trigger("database-update", this.allEntries());
        const operation_label =
          oldVersion !== null && oldVersion < version
            ? "Migrating"
            : this.isEmpty()
            ? "Initializing"
            : "Syncing";
        const { progress_bar, notice } = this.createNotice(operation_label, title);

        if (oldVersion !== null && oldVersion < version && !this.isEmpty()) {
          await this.clearDatabase();
          await this.rebuildDatabase(progress_bar, notice);
          this.trigger("database-migrate");
        } else if (this.isEmpty()) {
          await this.rebuildDatabase(progress_bar, notice);
          this.trigger("database-create");
        } else {
          await this.syncDatabase(progress_bar, notice);
        }
        this.ready = true;

        // Alternatives: use 'this.editorExtensions.push(EditorView.updateListener.of(async (update) => {'
        // 	for instant View updates, but this requires the file to be read into the file cache first
        this.registerEvent(
          this.plugin.app.vault.on("modify", async file => {
            if (file instanceof TFile && file.extension === "md") {
              const current_editor = this.plugin.app.workspace.activeEditor;
              const state =
                current_editor &&
                current_editor.file?.path === file.path &&
                current_editor.editor
                  ? current_editor.editor.cm.state
                  : undefined;
              const markdown = await this.plugin.app.vault.cachedRead(file);
              this.storeKey(
                file.path,
                await this.extractValue(markdown, file, state),
                file.stat.mtime,
              );
            }
          }),
        );

        this.registerEvent(
          this.plugin.app.vault.on("delete", async file => {
            if (file instanceof TFile && file.extension === "md")
              this.deleteKey(file.path);
          }),
        );

        this.registerEvent(
          this.plugin.app.vault.on("rename", async (file, oldPath) => {
            if (file instanceof TFile && file.extension === "md")
              this.renameKey(oldPath, file.path, file.stat.mtime);
          }),
        );

        this.registerEvent(
          this.plugin.app.vault.on("create", async file => {
            if (file instanceof TFile && file.extension === "md")
              this.storeKey(file.path, this.defaultValue(), file.stat.mtime);
          }),
        );
      });
    });
  }

  /**
   * Load database from indexedDB
   */
  async loadDatabase() {
    this.memory = new Map(
      Object.entries(
        (await this.persist.getItems()) as Record<string, DatabaseItem<T>>,
      ).map(([key, value]) => {
        value.data = this.loadValue(value.data);
        return [key, value];
      }),
    );
  }

  /**
   * Extract values from files and store them in the database
   * @remark Expensive, this function will block the main thread
   * @param files Files to extract values from and store/update in the database
   */
  async regularParseFiles(files: TFile[], progress_bar: HTMLProgressElement) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const value = this.getItem(file.path);
      if (value === null || value.mtime < file.stat.mtime) {
        const markdown = await this.plugin.app.vault.cachedRead(file);
        this.storeKey(
          file.path,
          await this.extractValue(markdown, file),
          file.stat.mtime,
          true,
        );
      }
      progress_bar.setAttribute("value", (i + 1).toString());
    }
  }

  /**
   * Extract values from files and store them in the database using workers
   * @remark Prefer usage of this function over regularParseFiles
   * @param files Files to extract values from and store/update in the database
   */
  // async workerParseFiles(files: TFile[], progress_bar: HTMLProgressElement) {
  //   const read_files = await Promise.all(
  //     files.map(async file => {
  //       return { file, markdown: await this.plugin.app.vault.cachedRead(file) };
  //     }),
  //   );
  //   const chunk_size = Math.ceil(files.length / this.workers);
  //   let processed = 0;

  //   for (let i = 0; i < this.workers; i++) {
  //     const worker: Worker = new Worker(null, {
  //       name: this.title + " indexer " + (i + 1),
  //     });
  //     const files_chunk = files.slice(i * chunk_size, (i + 1) * chunk_size);
  //     const read_files_chunk = read_files.slice(i * chunk_size, (i + 1) * chunk_size);
  //     worker.onmessage = (event: { data: T[] }) => {
  //       for (let j = 0; j < files_chunk.length; j++) {
  //         const file = files_chunk[j];
  //         const extracted_value = this.loadValue(event.data[j]);
  //         this.storeKey(file.path, extracted_value, file.stat.mtime, true);
  //         processed += 1;
  //         progress_bar.setAttribute("value", (processed + 1).toString());
  //       }
  //       worker.terminate();
  //     };
  //     worker.postMessage(read_files_chunk);
  //   }

  //   this.plugin.app.saveLocalStorage(this.name + "-version", this.version.toString());
  // }

  /**
   * Synchronize database with vault contents
   */
  async syncDatabase(progress_bar: HTMLProgressElement, notice: Notice) {
    const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
    this.initializeProgressBar(progress_bar, markdownFiles.length);
    this.allKeys().forEach(key => {
      if (!markdownFiles.some(file => file.path === key)) this.deleteKey(key);
    });

    const filesToParse = markdownFiles.filter(
      file =>
        !this.memory.has(file.path) ||
        this.memory.get(file.path)!.mtime < file.stat.mtime,
    );
    // if (filesToParse.length <= 100)
    //   await this.regularParseFiles(filesToParse, progress_bar);
    // else await this.workerParseFiles(filesToParse, progress_bar);
    await this.regularParseFiles(filesToParse, progress_bar);

    this.plugin.app.saveLocalStorage(this.name + "-version", this.version.toString());
    notice.hide();
  }

  /**
   * Rebuild database from scratch by parsing all files in the vault
   */
  async rebuildDatabase(progress_bar: HTMLProgressElement, notice: Notice) {
    const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
    this.initializeProgressBar(progress_bar, markdownFiles.length);
    // await this.workerParseFiles(markdownFiles, progress_bar);
    await this.regularParseFiles(markdownFiles, progress_bar);
    this.plugin.app.saveLocalStorage(this.name + "-version", this.version.toString());
    notice.hide();
  }

  /**
   * Persist in-memory database to indexedDB
   * @remark Prefer usage of flushChanges over this function to reduce the number of writes to indexedDB
   */
  async persistMemory() {
    const to_set: Record<string, DatabaseItem<T>> = {};
    for (const [key, value] of this.memory.entries()) {
      if (value.dirty) {
        to_set[key] = { data: value.data, mtime: value.mtime };
        this.memory.set(key, { data: value.data, mtime: value.mtime, dirty: false });
      }
    }

    await this.persist.setItems(to_set);
    await Promise.all(
      Array.from(this.deleted_keys.values()).map(
        async key => await this.persist.removeItem(key),
      ),
    );
    this.deleted_keys.clear();
  }

  createNotice(
    operation_label: string,
    title: string,
  ): { progress_bar: HTMLProgressElement; notice: Notice } {
    const document_fragment = new DocumentFragment();
    const message = document_fragment.createEl("div");
    const center = document_fragment.createEl("div", {
      cls: "commentator-progress-bar",
    });
    const notice = new Notice(document_fragment, 0);
    const progress_bar = center.createEl("progress");
    message.textContent = `${operation_label} ${title} database...`;
    return { progress_bar, notice };
  }

  initializeProgressBar(progress_bar: HTMLProgressElement, max: number) {
    progress_bar.setAttribute("max", max.toString());
    progress_bar.setAttribute("value", "0");
  }

  storeKey(key: string, value: T, mtime?: number, dirty = true) {
    this.memory.set(key, { data: value, mtime: mtime ?? Date.now(), dirty });
    this.databaseUpdate();
  }

  deleteKey(key: string) {
    const value = this.getItem(key) as MemoryDatabaseItem<T>;
    if (value == null) throw new Error("Key does not exist");

    this.memory.delete(key);
    this.deleted_keys.add(key);

    this.databaseUpdate();
  }

  renameKey(oldKey: string, newKey: string, mtime?: number) {
    const value = this.getItem(oldKey);
    if (value == null) throw new Error("Key does not exist");

    this.storeKey(newKey, value.data, mtime);
    this.deleteKey(oldKey);
    this.databaseUpdate();
  }

  allKeys(): string[] {
    return Array.from(this.memory.keys());
  }

  getValue(key: string): T | null {
    return this.memory.get(key)?.data ?? null;
  }

  allValues(): T[] {
    return Array.from(this.memory.values()).map(value => value.data);
  }

  getItem(key: string): DatabaseItem<T> | null {
    return this.memory.get(key) ?? null;
  }

  allItems(): DatabaseItem<T>[] {
    return Array.from(this.memory.values());
  }

  allEntries(): DatabaseEntry<T>[] | null {
    return Array.from(this.memory.entries());
  }

  /**
   * Clear in-memory cache, and completely remove database from indexedDB (and all references in localStorage)
   */
  async dropDatabase() {
    this.memory.clear();
    await localforage.dropInstance({
      name: this.name + `/${this.plugin.app.appId}`,
    });
    localStorage.removeItem(this.plugin.app.appId + "-" + this.name + "-version");
  }

  /**
   * Rebuild database from scratch
   * @remark Useful for fixing incorrectly set version numbers
   */
  async reinitializeDatabase() {
    await this.dropDatabase();
    this.persist = localforage.createInstance({
      name: this.name + `/${this.plugin.app.appId}`,
      driver: localforage.INDEXEDDB,
      version: this.version,
      description: this.description,
    });
    const operation_label = "Initializing";
    const { progress_bar, notice } = this.createNotice(operation_label, this.title);
    await this.rebuildDatabase(progress_bar, notice);
    this.trigger("database-update", this.allEntries());
  }

  /**
   * Clear in-memory cache, and clear database contents from indexedDB
   */
  async clearDatabase() {
    this.memory.clear();
    await this.persist.clear();
  }

  /**
   * Check if database is empty
   * @remark Run after `loadDatabase()`
   */
  isEmpty(): boolean {
    return this.memory.size === 0;
  }
}
