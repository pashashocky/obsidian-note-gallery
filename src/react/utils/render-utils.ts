import { useRef, useState, useLayoutEffect } from "preact/hooks";
import { useAppMount } from "~/react/context/app-mount-provider";
import { App, MarkdownRenderer, Component, MarkdownRenderChild, TFile } from "obsidian";
import { dbHTMLEntry } from "~/main";

export const appendOrReplaceFirstChild = (
  container: HTMLElement | null,
  child: HTMLElement | null,
) => {
  if (container === null) return;
  if (child === null) return;

  //If there is no first child, append the child
  if (container && !container.firstChild) {
    container.appendChild(child);
    //If there is already a child and it is not the same as the child, replace the child
  } else if (container.firstChild && container.firstChild !== child) {
    container.replaceChild(child, container.firstChild);
  }
};
export const renderMarkdown = async (
  app: App,
  sourcePath: string,
  component: Component,
  markdown: string,
) => {
  const div = document.createElement("div");
  div.style.height = "100%";
  div.style.width = "100%";

  try {
    if (component instanceof MarkdownRenderChild) {
      await MarkdownRenderer.render(app, markdown, div, sourcePath, component);
    }
  } catch (e) {
    console.error(e);
  }
  return div;
};

export const cachedMarkdown = (innerHTML: string) => {
  const div = document.createElement("div");
  div.style.height = "100%";
  div.style.width = "100%";

  try {
    div.innerHTML = innerHTML;
  } catch (e) {
    console.error(e);
  }
  return div;
};

export const useRenderMarkdown = (entry: dbHTMLEntry, file: TFile) => {
  const { app, db, component, sourcePath } = useAppMount();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderRef = useRef<HTMLElement | null>(null);
  const [rendered, setRendered] = useState(false);
  const [cached, setCached] = useState(true);

  useLayoutEffect(() => {
    (async () => {
      let el: HTMLDivElement | null = null;
      if (entry.rendered && entry.innerHTML) {
        el = cachedMarkdown(entry.innerHTML);
      } else if (entry.hasMarkdown && entry.markdown) {
        el = await renderMarkdown(app, sourcePath, component, entry.markdown);
        const value = { ...entry, rendered: true, innerHTML: el.innerHTML };
        db.storeKey(file.path, value, file.stat.mtime, false);
        setCached(false);
      }

      if (el && el.innerHTML) {
        //Set the markdown ref equal to the markdown element that we just created
        renderRef.current = el;

        //If the container ref is not null, append the element to the container
        if (containerRef.current) appendOrReplaceFirstChild(containerRef.current, el);

        setRendered(true);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, sourcePath]);

  return {
    containerRef,
    renderRef,
    rendered,
    cached,
  };
};

export const getResourcePath = (app: App, filePath: string) => {
  return app.vault.adapter.getResourcePath(filePath);
};
