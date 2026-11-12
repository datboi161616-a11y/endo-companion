import type { Log } from './diary';

export type ReportRange = { start: string; end: string };
type ReportBlock = { heading?: string; lines: string[] };
type ReportSection = { title: string; blocks: ReportBlock[] };

const fieldLabel = (name: string) => {
  const label = name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function commonValues(logs: Log[], field: string) {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const value = log.fields[field];
    const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
    for (const label of new Set(values.map((item) => item.trim()).filter(Boolean))) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts]
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .slice(0, 5)
    .map(([label, count]) => `${label} (${count})`)
    .join(', ');
}

export function buildReport(logs: Log[], range: ReportRange, titles: Record<Log['kind'], string>): ReportSection[] {
  const entries = logs
    .filter(({ date }) => (!range.start || date >= range.start) && (!range.end || date <= range.end))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const painLogs = entries.filter(({ kind }) => kind === 'pain');
  const intensities = painLogs.flatMap(({ fields }) => {
    const value = fields.intensity;
    const number = typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN;
    return Number.isFinite(number) && number >= 0 && number <= 10 ? [number] : [];
  });
  const counts = new Map<Log['kind'], number>();
  for (const { kind } of entries) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  const patterns = [
    ['Most logged pain locations', commonValues(painLogs, 'locations')],
    ['Most logged symptoms', commonValues(entries, 'symptoms')],
    ['Most logged medications', commonValues(entries, 'medications')],
  ].filter(([, values]) => values).map(([label, values]) => `${label}: ${values}`);
  const average = intensities.length
    ? Math.round(intensities.reduce((sum, value) => sum + value, 0) / intensities.length * 10) / 10
    : null;
  return [
    {
      title: 'Patient Summary',
      blocks: [{ lines: [
        `Report period: ${range.start || entries[0]?.date || 'Earliest entry'} to ${range.end || entries.at(-1)?.date || 'Latest entry'}`,
        'Summary of self-reported diary entries.',
      ] }],
    },
    {
      title: 'At a glance',
      blocks: [{ lines: [
        `Diary entries: ${entries.length}`,
        `Days with entries: ${new Set(entries.map(({ date }) => date)).size}`,
        `Pain entries: ${painLogs.length}`,
        ...(average === null ? [] : [
          `Average pain intensity: ${average}/10`,
          `Highest pain intensity: ${intensities.reduce((highest, value) => Math.max(highest, value), 0)}/10`,
        ]),
      ] }],
    },
    {
      title: 'Patterns and Context',
      blocks: [{ lines: [
        ...[...counts].map(([kind, count]) => `${titles[kind]} entries: ${count}`),
        ...patterns,
        ...(!entries.length ? ['No entries in this date range.'] : []),
      ] }],
    },
    {
      title: 'Daily Symptom Log',
      blocks: entries.length ? entries.map((entry) => ({
        heading: [entry.date, entry.time, titles[entry.kind]].filter(Boolean).join('  |  '),
        lines: [
          ...Object.entries(entry.fields).flatMap(([key, value]) => {
            const display = Array.isArray(value) ? value.join(', ') : String(value);
            return display.trim() ? [`${fieldLabel(key)}: ${display}`] : [];
          }),
          ...(entry.notes.trim() ? [`Notes: ${entry.notes}`] : []),
          ...(entry.attachment ? ['Attachment recorded in diary.'] : []),
        ],
      })) : [{ lines: ['No entries in this date range.'] }],
    },
  ];
}

const smartCharacters: Record<string, string> = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...' };

function pdfString(text: string) {
  return Array.from(text, (character) => {
    if (smartCharacters[character]) return smartCharacters[character];
    if ('()\\'.includes(character)) return '\\' + character;
    const code = character.charCodeAt(0);
    if (code >= 32 && code <= 126) return character;
    if (code >= 160 && code <= 255) return '\\' + code.toString(8).padStart(3, '0');
    return '?';
  }).join('');
}

function wrap(text: string): string[] {
  // Conservative Helvetica glyph widths in ems, based on the 516 pt text area at 11 pt.
  const maxWidth = 46;
  const width = (character: string) => {
    if (/[ilI.,:;|'! ]/.test(character)) return 0.36;
    if (/[MW@%]/.test(character)) return 1;
    if (/[A-Zmw]/.test(character)) return 0.9;
    return 0.7;
  };
  return text.split(/\r?\n/).flatMap((line) => {
    const lines: string[] = [];
    let remaining = Array.from(line.replace(/\s+/g, ' ').trim());
    while (remaining.length) {
      let used = 0;
      let end = 0;
      let space = -1;
      for (const character of remaining) {
        used += width(character);
        if (used > maxWidth) break;
        if (character === ' ') space = end;
        end++;
      }
      if (end < remaining.length && space > 0) end = space;
      lines.push(remaining.slice(0, end).join(''));
      remaining = remaining.slice(remaining[end] === ' ' ? end + 1 : end);
    }
    return lines.length ? lines : [''];
  });
}

export function createReportPdf(sections: ReportSection[]): Uint8Array<ArrayBuffer> {
  const pages: string[][] = [];
  let page: string[];
  let y = 699;

  function draw(text: string, size: number, bold: boolean, x: number, baseline: number, color: string) {
    page.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg 1 0 0 1 ${x} ${baseline} Tm (${pdfString(text)}) Tj ET`);
  }

  function beginPage() {
    page = [];
    pages.push(page);
    draw('Endometriosis Diary Report', 22, true, 48, 738, '0.19 0.11 0.17');
    page.push('0.94 0.25 0.43 RG 1.5 w 48 723 m 564 723 l S');
    draw(`Page ${pages.length}`, 9, false, 48, 36, '0.34 0.32 0.33');
    y = 699;
  }

  function reserve(height: number) {
    if (y - height < 58) beginPage();
  }

  function line(text: string, size: number, bold = false, color = '0.19 0.11 0.17') {
    const height = size + 5;
    reserve(height);
    draw(text, size, bold, 48, y, color);
    y -= height;
  }

  beginPage();
  for (const section of sections) {
    const blocks = section.blocks.map(({ heading, lines }) => {
      const details = lines.flatMap(wrap);
      const height = 16 * (details.length + (heading ? 1 : 0));
      return { heading, details, height: height <= 580 ? height : 36 };
    });
    reserve(20 + (blocks[0]?.height ?? 0));
    line(section.title, 15, true, '0.62 0.10 0.28');
    for (const { heading, details, height } of blocks) {
      if (heading) {
        reserve(height);
        line(heading, 11, true);
      }
      for (const detail of details) line(detail, 11);
      y -= 8;
    }
    y -= 8;
  }

  const pageIds = pages.map((_, index) => 5 + index * 2);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ...pages.flatMap((commands, index) => {
      const id = pageIds[index];
      const stream = commands.join('\n') + '\n';
      return [
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id + 1} 0 R >>`,
        `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
      ];
    }),
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const [index, object] of objects.entries()) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Uint8Array.from(pdf, (character) => character.charCodeAt(0));
}
