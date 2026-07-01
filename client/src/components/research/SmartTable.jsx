import React from 'react';

export default function SmartTable({ content }) {
  if (!content) return null;

  // Simple markdown table parser
  const parseMarkdownTable = (text) => {
    const lines = text.split('\n');
    const tableLines = lines.filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
    
    if (tableLines.length < 2) return null;

    // Filter out separator lines (e.g. |---|---|)
    const filteredLines = tableLines.filter(l => !l.includes('---') && !l.includes('==='));

    const rows = filteredLines.map(line => {
      return line
        .split('|')
        .slice(1, -1) // remove leading/trailing empty cells
        .map(cell => cell.trim());
    });

    if (rows.length === 0) return null;

    const headers = rows[0];
    const dataRows = rows.slice(1);

    return { headers, rows: dataRows };
  };

  const tableData = parseMarkdownTable(content);
  if (!tableData) return null;

  return (
    <div className="w-full my-4 bg-[#0A1628]/30 border border-white/5 rounded-md overflow-hidden shadow-md">
      <table className="w-full text-left border-collapse text-[10.5px] font-mono">
        <thead>
          <tr className="bg-[#0A1628] text-[#F4A726] border-b border-[#F4A726]/10 text-[9px] uppercase tracking-wider select-none">
            {tableData.headers.map((h, i) => (
              <th key={i} className="py-2.5 px-3 font-black">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {tableData.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-white/5 transition-colors duration-150 text-white">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="py-2 px-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
