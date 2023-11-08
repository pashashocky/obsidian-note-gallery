import { Fragment } from "preact";

import {
  useRenderMarkdown,
  appendOrReplaceFirstChild,
} from "~/react/utils/render-utils";

interface CardMarkdownContentRendererProps {
  content: string;
}

export default function CardMarkdownContentRenderer(
  props: CardMarkdownContentRendererProps,
) {
  const { content } = props;
  const { containerRef, renderRef, rendered } = useRenderMarkdown(content);
  return (
    <Fragment>
      {rendered ? (
        <div
          className="card-content-container"
          ref={node => {
            if (content !== "" && rendered) {
              containerRef.current = node;
              appendOrReplaceFirstChild(node, renderRef.current);
            }
          }}
        >
          {content === "" && content}
        </div>
      ) : (
        <div />
      )}
    </Fragment>
  );
}
