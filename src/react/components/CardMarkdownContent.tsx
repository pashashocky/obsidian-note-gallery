import { TFile } from "obsidian";
import React, { useState, useRef, useEffect } from "react";

import CardMarkdownContentRenderer from "~/react/components/CardMarkdownContentRenderer";
import { useAppMount } from "~/react/context/app-mount-provider";
import { useIntersectionObserver } from "~/react/utils/intersection-observer";

interface CardMarkdownContentProps {
  file: TFile;
}

export default function CardMarkdownContent(props: CardMarkdownContentProps) {
  const { app } = useAppMount();
  const { file } = props;
  const { vault } = app;
  const [content, setContent] = useState("");

  const ref = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(ref, {
    rootMargin: "33%",
    freezeOnceVisible: true,
  });
  const isVisible = !!entry?.isIntersecting;
  const linesToKeep = 30;

  useEffect(() => {
    (async () => {
      if (isVisible) {
        let c = await vault.cachedRead(file);

        // the idea of the below is to trim the content to the first n lines
        let meta = "";
        if (c.startsWith("---")) {
          const i = c.indexOf("---", 3); // second instance
          meta = c.slice(0, i + 3).trim();
          c = c.slice(i + 3, c.length).trim();
        }
        c = c.split("\n").splice(0, linesToKeep).join("\n");
        c = [meta, c].join("\n").trim();

        setContent(c);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, file]);

  return (
    <React.Fragment>
      <div className="inline-title">{file.basename}</div>
      <hr />
      <div className="card-content" ref={ref}>
        <div className="card-content-wall" />
        {isVisible && <CardMarkdownContentRenderer content={content} />}
      </div>
    </React.Fragment>
  );
}
