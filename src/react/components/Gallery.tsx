import { Platform, TFile } from "obsidian";
import { useState } from "preact/hooks";

import Masonry from "~/react/masonry";
import Card from "~/react/components/Card";
import CardMarkdownContent from "~/react/components/CardMarkdownContent";
import Loader from "~/react/components/Loader";
import { useFiles } from "~/react/utils/use-files";
import { useAppMount } from "~/react/context/app-mount-provider";
import { getResourcePath } from "~/react/utils/render-utils";

const Error = ({ error }: { error: string }) => {
  return (
    <p
      style={{
        borderRadius: "4px",
        padding: "2px 16px",
        backgroundColor: "#e50914",
        color: "#fff",
        fontWeight: "bolder",
      }}
    >
      (Error) Note Gallery: {error}
    </p>
  );
};

export default function Gallery() {
  const { app, settings } = useAppMount();
  const itemsPerPage = Platform.isDesktopApp ? 100 : 10;
  const { error, files } = useFiles();
  const [hasMore, setHasMore] = useState(true);
  const [numRendered, setNumRendered] = useState(itemsPerPage);

  const loadMore = () => {
    if (numRendered >= files.length) {
      setHasMore(false);
    } else {
      setTimeout(() => {
        setNumRendered(numRendered + itemsPerPage);
      }, 100);
    }
  };

  const renderFiles = (files: TFile[]) => {
    const items = [];
    for (let i = 0; i < numRendered; i++) {
      const file = files[i];
      if (file && file.extension === "md") {
        items.push(
          <Card key={file.name} file={file}>
            <CardMarkdownContent file={file} />
          </Card>,
        );
      } else if (file) {
        items.push(
          <Card key={file.name} file={file}>
            <img src={getResourcePath(app, file.path)} />
          </Card>,
        );
      }
    }
    return items;
  };

  return (
    <div>
      {error && <Error error={error} />}
      {files.length > 0 && (
        <Masonry
          breakpointCols={settings.breakpoints}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {renderFiles(files)}
          <Loader hasMore={hasMore} loadMore={loadMore} />
        </Masonry>
      )}
    </div>
  );
}
