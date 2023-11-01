import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TFile,
} from "obsidian";
import React, {
  useState,
  useEffect,
  useRef,
  PropsWithChildren,
  StrictMode,
} from "react";
import { createRoot, Root } from "react-dom/client";

import Masonry from "masonry";
import NoteGalleryPlugin from "main";
import AppMount from "ui/app-mount-provider";
import { useRenderMarkdown, appendOrReplaceFirstChild } from "ui/render-utils";
import getFileList from "code-block/files";
import getSettings, { Settings } from "code-block/settings";

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

const CardMarkdownContent = (props: CardMarkdownContentProps) => {
  const { app, file } = props;
  const { vault } = app;
  const [content, setContent] = React.useState("");
  const { containerRef, renderRef } = useRenderMarkdown(content);
  const [inView, setInView] = useState(false);
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const f = async () => {
      const c = await vault.cachedRead(file);
      setContent(c);
    };
    f();
  }, [vault, file]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      }
    }, {});
    observer.observe(placeholderRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // return inView ? (
  //   <img {...props} alt={props.alt || ""} />
  // ) : (
  //   <img {...props} ref={placeholderRef} src={placeholder} alt={props.alt || ""} />
  // );

  return (
    <React.Fragment>
      <div className="inline-title">{file.basename}</div>
      <hr />
      <div className="card-content">
        {inView ? (
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
        ) : (
          <div ref={placeholderRef}>test</div>
        )}
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
