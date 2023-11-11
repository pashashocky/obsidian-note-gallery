import { useEffect, useRef } from "preact/hooks";

import { useIntersectionObserver } from "~/react/utils/intersection-observer";
import Card from "./Card";

interface LoaderProps {
  hasMore: boolean;
  loadMore: () => void;
}

export default function Loader(props: LoaderProps) {
  const { hasMore, loadMore } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(ref, {});
  const isVisible = !!entry?.isIntersecting;

  useEffect(() => {
    if (hasMore && isVisible) {
      loadMore();
    }
  }, [isVisible, hasMore, loadMore]);

  return (
    <div ref={ref}>
      {hasMore && (
        <Card>
          <h1>Hold on a second...</h1>
          <h6>There are more files!</h6>
        </Card>
      )}
    </div>
  );
}
