import { TFile } from "obsidian";
import { PropsWithChildren, MouseEvent } from "react";

import { useAppMount } from "~/react/context/app-mount-provider";

interface WithKeyProps {
  key?: React.Key;
}

interface CardPropsI {
  file: TFile;
}

type CardProps = CardPropsI & React.HTMLAttributes<HTMLDivElement> & WithKeyProps;

export default function Card(props: PropsWithChildren<CardProps>) {
  const { file, ...rest } = props;
  const { app, sourcePath } = useAppMount();
  const handleClick = (event: MouseEvent): void => {
    const newLeaf =
      event.altKey && (event.ctrlKey || event.metaKey)
        ? "split"
        : event.ctrlKey || event.metaKey
        ? "tab"
        : false;
    app.workspace.openLinkText(file.path, sourcePath, newLeaf);
  };
  return (
    <div {...rest} className="note-card" onClick={handleClick}>
      {props.children}
    </div>
  );
}
