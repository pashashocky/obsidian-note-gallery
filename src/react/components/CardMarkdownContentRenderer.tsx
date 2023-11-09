import { Fragment } from "preact";

import {
  useRenderMarkdown,
  appendOrReplaceFirstChild,
} from "~/react/utils/render-utils";
import { ContentI } from "./CardMarkdownContent";

interface CardMarkdownContentRendererProps {
  content: ContentI;
  isVisible: boolean;
}

export default function CardMarkdownContentRenderer(
  props: CardMarkdownContentRendererProps,
) {
  const { content, isVisible } = props;
  const { containerRef, renderRef, rendered } = useRenderMarkdown(content.markdown);
  return (
    <Fragment>
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity ease-in 200ms",
        }}
        className="card-content-container"
        ref={node => {
          if (content.markdown !== "" && rendered && isVisible) {
            containerRef.current = node;
            appendOrReplaceFirstChild(node, renderRef.current);
          }
        }}
      >
        <div style={{ opacity: 0, whiteSpace: "pre-wrap" }}>{content.text}</div>
      </div>
    </Fragment>
  );
}
