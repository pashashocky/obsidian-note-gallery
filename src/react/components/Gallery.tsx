import { TFile } from "obsidian";

import Masonry from "~/react/masonry";
import Card from "~/react/components/Card";
import CardMarkdownContent from "~/react/components/CardMarkdownContent";
import Loader from "~/react/components/Loader";
import { useAppMount } from "~/react/context/app-mount-provider";
import { getResourcePath } from "~/react/utils/render-utils";
import { useState } from "preact/hooks";

export default function Gallery({ files }: { files: TFile[] }) {
  const { app } = useAppMount();
  const breakpointColumnsObj = {
    default: 4,
    100000: 10,
    3500: 10,
    3100: 9,
    2700: 8,
    2300: 7,
    1900: 6,
    1500: 5,
    1000: 4,
    700: 3,
    400: 2,
  };

  const itemsPerPage = 200;
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
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {renderFiles(files)}
        <Loader hasMore={hasMore} loadMore={loadMore} />
      </Masonry>
    </div>
  );
}
