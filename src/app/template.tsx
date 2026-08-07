/**
 * Re-mounts on every navigation (unlike layout.tsx, which persists), so the
 * fade below actually replays each time a route changes rather than only on
 * first load.
 */
export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
