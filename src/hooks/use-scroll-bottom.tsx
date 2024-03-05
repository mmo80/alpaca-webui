import { RefObject, useEffect, useState } from 'react';

const useScrollBottom = (elementRef: RefObject<HTMLDivElement>) => {
  const [isScrollBottom, setIsScrollBottom] = useState(true);

  useEffect(() => {
    const checkScroll = () => {
      const awayFromBottom = isRefAwayFromBottom(elementRef);
      setIsScrollBottom(!awayFromBottom);
      console.log(`isScrollBottom: ${!awayFromBottom}`);
    };

    checkScroll();

    const div = elementRef.current;
    if (div) {
      div.addEventListener('scroll', checkScroll);
    }

    return () => {
      if (div) {
        div.removeEventListener('scroll', checkScroll);
      }
    };
  }, [elementRef]);

  const isRefAwayFromBottom = (ref: RefObject<HTMLDivElement>): boolean => {
    if (!ref.current) return true;
    const bufferHeight = 50;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    return Math.ceil(scrollTop + clientHeight) < scrollHeight - bufferHeight;
  };

  return { isScrollBottom };
};

export default useScrollBottom;
