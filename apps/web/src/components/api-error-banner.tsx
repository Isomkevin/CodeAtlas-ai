import { Link } from "@tanstack/react-router";

const baseClass = "mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive";

function looksLikeAuthError(message: string): boolean {
  return /not authenticated/i.test(message) || /\(401\)/.test(message);
}

export function ApiErrorBanner({ error, className }: { error: string | null; className?: string }) {
  if (!error) return null;
  const wrapper = className ? `${className} ${baseClass}` : `mx-6 ${baseClass}`;

  if (looksLikeAuthError(error)) {
    return (
      <Link
        to="/settings"
        search={{ tab: "integrations" }}
        className={`${wrapper} block underline underline-offset-2 hover:brightness-125`}
      >
        {error} — click to connect GitHub in Settings.
      </Link>
    );
  }
  return <div className={wrapper}>{error}</div>;
}
