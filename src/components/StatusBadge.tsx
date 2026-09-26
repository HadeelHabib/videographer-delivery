const STYLES: Record<string, { className: string; label?: string; pulse?: boolean }> = {
  // gallery
  draft: { className: "text-[#6f6b63] bg-[#f0eee9]", label: "Draft" },
  ready: { className: "text-[#1f5f99] bg-[#1f5f99]/10", label: "Ready" },
  delivered: { className: "text-[#1f7a4d] bg-[#1f7a4d]/10", label: "Delivered" },
  archived: { className: "text-[#5b4a8b] bg-[#5b4a8b]/10", label: "Archived" },
  // media / rendition / job
  uploading: { className: "text-[#1f5f99] bg-[#1f5f99]/10", label: "Uploading", pulse: true },
  queued: { className: "text-[#6f6b63] bg-[#f0eee9]", label: "Queued" },
  processing: { className: "text-[#9a6700] bg-[#9a6700]/10", label: "Processing", pulse: true },
  failed: { className: "text-[#b3261e] bg-[#b3261e]/10", label: "Failed" },
  expired: { className: "text-[#b3261e] bg-[#b3261e]/10", label: "Expired" },
  // comments
  pending: { className: "text-[#9a6700] bg-[#9a6700]/10", label: "Pending" },
  approved: { className: "text-[#1f7a4d] bg-[#1f7a4d]/10", label: "Approved" },
  rejected: { className: "text-[#b3261e] bg-[#b3261e]/10", label: "Rejected" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const style = STYLES[status] ?? { className: "text-[#6f6b63] bg-[#f0eee9]" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${style.pulse ? "animate-pulse" : ""}`} />
      {label ?? style.label ?? status}
    </span>
  );
}
