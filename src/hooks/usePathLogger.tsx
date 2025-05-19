
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePathLogger() {
  const location = useLocation();
  
  useEffect(() => {
    console.log(`📍 Path changed: ${location.pathname}`);
  }, [location.pathname]);
  
  return location;
}
