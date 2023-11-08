import { TFile } from "obsidian";

import Masonry from "~/react/masonry";
import Card from "~/react/components/Card";
import CardMarkdownContent from "~/react/components/CardMarkdownContent";
import { useAppMount } from "~/react/context/app-mount-provider";
import { getResourcePath } from "~/react/utils/render-utils";

export default function Gallery({ files }: { files: TFile[] }) {
  const { app } = useAppMount();
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

  const showItems = (files: TFile[]) => {
    const items = [];
    for (let i = 0; i < files.length; i++) {
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
        {showItems(files)}
      </Masonry>
    </div>
  );
}
