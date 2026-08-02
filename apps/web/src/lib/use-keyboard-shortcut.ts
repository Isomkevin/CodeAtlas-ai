import { useEffect } from "react";

type Options = {
  withMeta?: boolean;
  withShift?: boolean;
  enabled?: boolean;
  allowInInputs?: boolean;
};

export function useKeyboardShortcut(
  keys: string | string[],
  handler: (event: KeyboardEvent) => void,
  { withMeta = false, withShift = false, enabled = true, allowInInputs = false }: Options = {},
) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const targetKeys = Array.isArray(keys) ? keys : [keys];
    const onKeyDown = (event: KeyboardEvent) => {
      if (!allowInInputs) {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      }
      if (withMeta && !(event.metaKey || event.ctrlKey)) return;
      if (!withMeta && (event.metaKey || event.ctrlKey || event.altKey)) return;
      if (withShift && !event.shiftKey) return;
      if (!withShift && event.shiftKey) return;
      if (!targetKeys.includes(event.key)) return;
      handler(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allowInInputs, enabled, handler, keys, withMeta, withShift]);
}
