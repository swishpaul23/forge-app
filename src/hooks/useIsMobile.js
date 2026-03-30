import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = (e) => setIsMobile(e.matches);
    
    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    // Legacy fallback
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  return isMobile;
};

export default useIsMobile;
