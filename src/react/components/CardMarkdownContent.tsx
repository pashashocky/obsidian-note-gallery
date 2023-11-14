import { TFile } from "obsidian";
import { Fragment } from "preact";

import CardMarkdownContentRenderer from "~/react/components/CardMarkdownContentRenderer";

interface CardMarkdownContentProps {
  file: TFile;
}

export default function CardMarkdownContent(props: CardMarkdownContentProps) {
  const { file } = props;

  return (
    <Fragment>
      <div className="inline-title">{file.basename}</div>
      <div className="card-content">
        <div className="card-content-wall" />
        <CardMarkdownContentRenderer file={file} />
      </div>
    </Fragment>
  );
}
