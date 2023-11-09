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
      let c = await vault.cachedRead(file);

      // the idea of the below is to trim the content to the first n lines
      let meta = "";
      if (c.startsWith("---")) {
        const i = c.indexOf("---", 3); // second instance
        meta = c.slice(0, i + 3).trim();
        c = c.slice(i + 3, c.length).trim();
      }
      const text = c.split("\n").splice(0, linesToKeep).join("\n");
      c = [meta, text].join("\n").trim();

      setContent({ text, markdown: c });
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
