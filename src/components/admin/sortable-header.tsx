"use client";

export function SortableHeader({
  label,
  sortKey,
  activeKey,
  ascending,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  activeKey: string | null;
  ascending: boolean;
  onSort: (key: string) => void;
  className?: string;
}) {
  return (
    <th className={`px-4 py-3 font-medium ${className ?? ""}`}>
      <button type="button" onClick={() => onSort(sortKey)} className="flex items-center gap-1 hover:text-foreground">
        {label}
        {activeKey === sortKey && <span className="text-xs">{ascending ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}
