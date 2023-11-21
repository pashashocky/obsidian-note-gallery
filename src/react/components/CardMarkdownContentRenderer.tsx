import { TFile } from "obsidian";
import { Fragment } from "preact";
import { useRef } from "preact/hooks";

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
  const { db, settings } = useAppMount();
  const { file } = props;

  const fileCache = db.getItem(file.path)!;
  const { data } = fileCache;
  const { containerRef, renderRef, rendered, cached } = useRenderMarkdown(data, file);

  const ref = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(ref, {
    rootMargin: "33%",
    freezeOnceVisible: true,
  });
  const isVisible = !!entry?.isIntersecting;

  return (
    <Fragment>
      <div ref={ref}>
        {settings.showtitle && (
          <hr
            style={{
              borderTop: cached ? "" : "1px solid var(--interactive-accent-tint)",
            }}
          />
        )}
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transition: "opacity ease-in 100ms",
          }}
          className="card-content-container"
          ref={node => {
            if (data.hasMarkdown && data.markdown !== "" && rendered && isVisible) {
              containerRef.current = node;
              appendOrReplaceFirstChild(node, renderRef.current);
            }
          }}
        >
          <div style={{ opacity: 0, whiteSpace: "pre-wrap" }}>{data.text}</div>
        </div>
      </div>
    </Fragment>
  );
}
