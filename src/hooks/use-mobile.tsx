import React from "react"; // Changed from import * as React

const MOBILE_BREAKPOINT = 768; // Keep as md breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Check if window is defined (for server-side rendering)
    if (typeof window === 'undefined') {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(mql.matches); // Use mql.matches for reliability
    };

    mql.addEventListener("change", onChange);
    // Initial check
    setIsMobile(mql.matches);

    // Cleanup listener on component unmount
    return () => mql.removeEventListener("change", onChange);
  }, []); // Empty dependency array ensures this runs only once on mount

  return isMobile === undefined ? false : isMobile; // Return false during SSR or initial load
}
