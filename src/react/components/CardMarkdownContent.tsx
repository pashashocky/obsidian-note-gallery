import { TFile } from "obsidian";
import { Fragment } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";

import CardMarkdownContentRenderer from "~/react/components/CardMarkdownContentRenderer";
import { useAppMount } from "~/react/context/app-mount-provider";
import { useIntersectionObserver } from "~/react/utils/intersection-observer";

interface CardMarkdownContentProps {
  file: TFile;
}

export interface ContentI {
  text: string;
  markdown: string;
}

export default function CardMarkdownContent(props: CardMarkdownContentProps) {
  const { app } = useAppMount();
  const { file } = props;
  const { vault } = app;
  const [content, setContent] = useState<ContentI>({ text: "", markdown: "" });

  const ref = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(ref, {
    rootMargin: "33%",
    freezeOnceVisible: true,
  });
  const isVisible = !!entry?.isIntersecting;
  const linesToKeep = 30;

  useEffect(() => {
    (async () => {
      let markdown = await vault.cachedRead(file);

      // the idea of the below is to trim the content to the first n linesToKeep
      let frontmatter = "";
      if (markdown.startsWith("---")) {
        const i = markdown.indexOf("---", 3); // second instance
        frontmatter = markdown.slice(0, i + 3).trim();
        markdown = markdown.slice(i + 3, markdown.length).trim();
      }
      const text = markdown.split("\n").slice(0, linesToKeep).join("\n");
      markdown = [frontmatter, text].join("\n").trim();

      setContent({ text, markdown: markdown });
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  return (
    <Fragment>
      <div className="inline-title">{file.basename}</div>
      <hr />
      <div className="card-content" ref={ref}>
        <div className="card-content-wall" />
        <CardMarkdownContentRenderer content={content} isVisible={isVisible} />
      </div>
    </Fragment>
  );
}
