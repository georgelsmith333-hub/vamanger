export function exportToCsv(data: ReadonlyArray<Record<string, unknown> | object>, filename: string) {
  if (!data.length) return;
  const first = data[0] as Record<string, unknown>;
  const keys = Object.keys(first);
  const header = keys.join(',');
  const rows = data.map(row => {
    const r = row as Record<string, unknown>;
    return keys.map(k => {
      const v = r[k];
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(',');
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
