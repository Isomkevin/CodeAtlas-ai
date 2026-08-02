import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "codeatlas.panel.";

export function useCollapsiblePanel(id: string, defaultCollapsed = false) {
  const [collapsed, setCollapsedState] = useState<boolean>(defaultCollapsed);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_PREFIX + id);
    if (raw !== null) setCollapsedState(raw === "1");
  }, [id]);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_PREFIX + id, value ? "1" : "0");
    }
  }, [id]);

  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);

  return { collapsed, toggle, setCollapsed };
}
