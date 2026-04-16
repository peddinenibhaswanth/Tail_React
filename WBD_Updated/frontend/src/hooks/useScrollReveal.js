import { useEffect, useRef } from "react";

/**
 * Custom hook that adds scroll-reveal animation to elements.
 * Uses IntersectionObserver for performance.
 *
 * @param {Object} options
 * @param {string} options.selector - CSS selector for elements to animate (default: '.scroll-reveal')
 * @param {number} options.threshold - How much of element must be visible (0-1, default: 0.15)
 * @param {string} options.rootMargin - Margin around root (default: '0px 0px -40px 0px')
 */
const useScrollReveal = (options = {}) => {
  const {
    selector = ".scroll-reveal",
    threshold = 0.15,
    rootMargin = "0px 0px -40px 0px",
  } = options;

  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current || document;
    const elements = root.querySelectorAll(selector);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [selector, threshold, rootMargin]);

  return containerRef;
};

export default useScrollReveal;
