import { TFile } from "obsidian";
import { Fragment } from "preact";

import CardMarkdownContentRenderer from "~/react/components/CardMarkdownContentRenderer";
import { useAppMount } from "../context/app-mount-provider";

interface CardMarkdownContentProps {
  file: TFile;
}

export default function CardMarkdownContent(props: CardMarkdownContentProps) {
  const { settings } = useAppMount();
  const { file } = props;

  return (
    <Fragment>
      {settings.showtitle && <div className="inline-title">{file.basename}</div>}
      <div className="card-content">
        <div className="card-content-wall" />
        <CardMarkdownContentRenderer file={file} />
      </div>
    </Fragment>
  );
}
