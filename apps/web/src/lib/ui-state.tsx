import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type UIState = {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  toggleFocusMode: () => void;
};

const UIStateContext = createContext<UIState | null>(null);

export function UIStateProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);
  const toggleFocusMode = useCallback(() => setFocusMode((current) => !current), []);
  const value = useMemo(() => ({ focusMode, setFocusMode, toggleFocusMode }), [focusMode, toggleFocusMode]);
  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

export function useUIState(): UIState {
  const context = useContext(UIStateContext);
  if (!context) throw new Error("useUIState must be used within UIStateProvider");
  return context;
}
