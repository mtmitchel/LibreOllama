/**
 * Simple throttle utility to replace lodash dependency
 * Ensures a function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      lastExecTime = currentTime;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastExecTime = Date.now();
        timeoutId = null;
        func(...args);
      }, delay - (currentTime - lastExecTime));
    }
  };
} 