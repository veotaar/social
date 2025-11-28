import { useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useScrollContext } from "@web/lib/scroll-context";

type UseVirtualizedInfiniteFeedOptions<T> = {
  items: T[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  estimateSize?: number;
  overscan?: number;
  fetchThreshold?: number;
};

export function useVirtualizedInfiniteFeed<T>({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  estimateSize = 400,
  overscan = 5,
  fetchThreshold = 3,
}: UseVirtualizedInfiniteFeedOptions<T>) {
  const { scrollElementRef } = useScrollContext();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // auto-fetch when approaching the end
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= items.length - fetchThreshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    items.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    fetchThreshold,
  ]);

  return {
    virtualizer,
    virtualItems,
    totalSize: virtualizer.getTotalSize(),
    measureElement: virtualizer.measureElement,
  };
}
