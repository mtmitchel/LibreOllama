import { useState, useCallback } from 'react';

interface UseFocusModeOutput {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  enableFocusMode: () => void;
  disableFocusMode: () => void;
}

export const useFocusMode = (): UseFocusModeOutput => {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const enableFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  const disableFocusMode = useCallback(() => {
    setIsFocusMode(false);
  }, []);

  return { isFocusMode, toggleFocusMode, enableFocusMode, disableFocusMode };
};