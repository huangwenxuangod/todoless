import { useEffect, useRef } from "react";

export function useScrollVisibility<T extends HTMLElement>(hideDelay = 700) {
  const ref = useRef<T>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onScroll = () => {
    const element = ref.current;
    if (!element) return;

    element.classList.add("scrolling");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      element.classList.remove("scrolling");
    }, hideDelay);
  };

  return { onScroll, ref };
}
