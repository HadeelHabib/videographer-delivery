import type { GalleryDetailData } from "./types";

export function AccessLogTab({ logs }: { logs: GalleryDetailData["accessLogs"] }) {
  if (logs.length === 0) return <p className="text-sm text-zinc-500">No activity yet.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">IP Address</th>
            <th className="px-4 py-3">When</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3 capitalize text-zinc-700">{log.action}</td>
              <td className="px-4 py-3 text-zinc-500">{log.ipAddress ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-500">{new Date(log.accessedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
