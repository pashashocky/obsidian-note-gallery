import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TFile,
} from "obsidian";
import React, { useState, useRef, PropsWithChildren, StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

import Masonry from "masonry";
import NoteGalleryPlugin from "main";
import AppMount from "ui/app-mount-provider";
import { useRenderMarkdown, appendOrReplaceFirstChild } from "ui/render-utils";
import getFileList from "code-block/files";
import getSettings, { Settings } from "code-block/settings";
import { useIntersectionObserver } from "ui/intersection-observer";

interface WithKeyProps {
  key?: React.Key;
}

type CardProps = React.HTMLAttributes<HTMLDivElement> & WithKeyProps;

const Card = (props: PropsWithChildren<CardProps>) => {
  return (
    <div {...props} className="note-card">
      {props.children}
    </div>
  );
};

interface CardMarkdownContentProps {
  file: TFile;
  app: App;
}

interface CardMarkdownContentRendererProps {
  content: string;
}

const CardMarkdownContentRenderer = (props: CardMarkdownContentRendererProps) => {
  const { content } = props;
  const { containerRef, renderRef } = useRenderMarkdown(content);
  return (
    <div
      ref={node => {
        if (content !== "") {
          containerRef.current = node;
          appendOrReplaceFirstChild(node, renderRef.current);
        }
      }}
    >
      {content === "" && content}
    </div>
  );
};

const CardMarkdownContent = (props: CardMarkdownContentProps) => {
  const { app, file } = props;
  const { vault } = app;
  const [content, setContent] = useState("");

  const ref = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(ref, { freezeOnceVisible: true });
  const isVisible = !!entry?.isIntersecting;

  React.useEffect(() => {
    (async () => {
      if (isVisible) {
        const c = await vault.cachedRead(file);
        setContent(c);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, file.path]);

  return (
    <React.Fragment>
      <div className="inline-title" ref={ref}>
        {file.basename}
      </div>
      <hr />
      <div className="card-content">
        {isVisible && <CardMarkdownContentRenderer content={content} />}
      </div>
    </React.Fragment>
  );
};

const View = ({ app, files }: { app: App; files: TFile[] }) => {
  const breakpointColumnsObj = {
    default: 10,
    3100: 9,
    2700: 8,
    2300: 7,
    1900: 6,
    1500: 5,
    1000: 4,
    700: 3,
    400: 2,
  };

  return (
    <div>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {files.map(file => {
          if (file.extension === "md") {
            return (
              <Card key={file.name}>
                <CardMarkdownContent app={app} file={file} />
              </Card>
            );
          } else {
            return (
              <Card key={file.name}>
                <img src={app.vault.adapter.getResourcePath(file.path)} />
              </Card>
            );
          }
        })}
      </Masonry>
    </div>
  );
};

export default class CodeBlockNoteGallery extends MarkdownRenderChild {
  private root: Root | null;
  private settings: Settings;
  private files: TFile[];

  constructor(
    public plugin: NoteGalleryPlugin,
    public src: string,
    public containerEl: HTMLElement,
    public app: App,
    public ctx: MarkdownPostProcessorContext,
  ) {
    super(containerEl);
    this.root = null;
    this.settings = getSettings(src, app, containerEl, ctx);
    this.files = getFileList(app, containerEl, this.settings);
  }

  async onload() {
    this.root = createRoot(this.containerEl);
    this.root.render(
      <StrictMode>
        <AppMount app={this.app} component={this} sourcePath={this.ctx.sourcePath}>
          <View app={this.app} files={this.files} />
        </AppMount>
      </StrictMode>,
    );
  }

  async onunload() {
    this.root?.unmount();
  }
}
