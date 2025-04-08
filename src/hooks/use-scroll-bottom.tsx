import { type RefObject, useEffect, useState } from 'react';

export const useScrollBottom = (elementRef: RefObject<HTMLDivElement | null>) => {
  const [isScrollBottom, setIsScrollBottom] = useState(true);

  useEffect(() => {
    const isRefAwayFromBottom = (): boolean => {
      if (!elementRef?.current) return true;
      const bufferHeight = 50;

      const { scrollTop, scrollHeight, clientHeight } = elementRef.current;
      return Math.ceil(scrollTop + clientHeight) < scrollHeight - bufferHeight;
    };

    const checkScroll = () => {
      const awayFromBottom = isRefAwayFromBottom();
      setIsScrollBottom(!awayFromBottom);
    };

    checkScroll();

    const div = elementRef?.current;
    if (div) {
      div.addEventListener('scroll', checkScroll);
    }

    return () => {
      if (div) {
        div.removeEventListener('scroll', checkScroll);
      }
    };
  }, [elementRef]);

  return { isScrollBottom };
};
