import { TFile } from "obsidian";
import { Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import {
  useRenderMarkdown,
  appendOrReplaceFirstChild,
} from "~/react/utils/render-utils";
import { useAppMount } from "../context/app-mount-provider";
import { useIntersectionObserver } from "~/react/utils/intersection-observer";

interface CardMarkdownContentRendererProps {
  file: TFile;
}

export interface ContentI {
  text: string;
  markdown: string;
}

export default function CardMarkdownContentRenderer(
  props: CardMarkdownContentRendererProps,
) {
  const { app, db } = useAppMount();
  const { vault } = app;
  const { file } = props;
  const [content, setContent] = useState<ContentI>({ text: "", markdown: "" });
  // const { containerRef, renderRef, rendered } = useRenderMarkdown(
  //   content.markdown,
  //   file,
  // );
  const [innerHTML, setInnerHTML] = useState("");

  const ref = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(ref, {
    rootMargin: "33%",
    freezeOnceVisible: true,
  });
  const isVisible = !!entry?.isIntersecting;

  // const linesToKeep = 30;
  // useEffect(() => {
  //   (async () => {
  //     let markdown = await vault.cachedRead(file);

  //     // the idea of the below is to trim the content to the first n linesToKeep
  //     let frontmatter = "";
  //     if (markdown.startsWith("---")) {
  //       const i = markdown.indexOf("---", 3); // second instance
  //       frontmatter = markdown.slice(0, i + 3).trim();
  //       markdown = markdown.slice(i + 3, markdown.length).trim();
  //     }
  //     const text = markdown.split("\n").slice(0, linesToKeep).join("\n");
  //     markdown = [frontmatter, text].join("\n").trim();

  //     setContent({ text, markdown: markdown });
  //   })();

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [file]);

  useEffect(() => {
    (async () => {
      const value = await db.getValue(file.path);
      if (value) {
        setInnerHTML(value.innerHTML as string);
      }
    })();
  }, [db, file.path]);

  return (
    <Fragment>
      <div ref={ref}>
        <hr style={{ borderTop: "1px solid sandybrown" }} />
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transition: "opacity ease-in 200ms",
          }}
          className="card-content-container"
          ref={node => {
            // if (content.markdown !== "" && rendered && isVisible) {
            // containerRef.current = node;
            // appendOrReplaceFirstChild(node, renderRef.current);
            // }
          }}
        >
          {/*<div style={{ opacity: 0, whiteSpace: "pre-wrap" }}>{content.text}</div>*/}
          <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
        </div>
      </div>
    </Fragment>
  );
}
