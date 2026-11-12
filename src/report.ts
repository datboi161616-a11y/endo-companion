import type { Log } from './diary';

export type ReportRange = { start: string; end: string };
type ReportBlock = { heading?: string; lines: string[] };
type DailyRow = { date: string; pain: string[]; tracking: string[]; relief: string[] };
export type ReportSection = { title: string; blocks: ReportBlock[]; dailyRows?: DailyRow[]; locations?: {name: string; days: number; percent: number}[]; trend?: { date: string; pain: number; period: boolean }[] };
export type Patient = { name: string; dob: string };

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

export function buildReport(logs: Log[], range: ReportRange, titles: Record<Log['kind'], string>, patient: Patient = { name: '', dob: '' }): ReportSection[] {
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
  const periodDays = new Set(entries.filter(log => log.kind === 'period' && log.fields.flow !== 'None').map(log => log.date));
  const days = [...new Set(entries.map(log => log.date))];
  const mean = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : null;
  const score = (log: Log) => {
    const raw = log.fields.intensity;
    const n = typeof raw === 'number' || (typeof raw === 'string' && raw.trim()) ? Number(raw) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 10 ? [n] : [];
  };
  const trend = days.flatMap(date => {
    const pain = mean(painLogs.filter(log => log.date === date).flatMap(score));
    return pain === null ? [] : [{ date, pain, period: periodDays.has(date) }];
  });
  const peakOn = (dates: Set<string>) => {
    const values = painLogs.filter(log => dates.has(log.date)).flatMap(score);
    return values.length ? Math.max(...values) : null;
  };
  const painOn = (matching: Set<string>) => mean(trend.filter(day => matching.has(day.date)).map(day => day.pain));
  const formatted = (value: number | null) => value === null ? 'Not recorded' : `${value}/10`;
  function frequency(field: string, source = entries) {
    const found = new Map<string, Set<string>>();
    for (const log of source) {
      const raw = log.fields[field];
      const values = Array.isArray(raw) ? raw : typeof raw === 'string' && raw.trim() ? [raw] : [];
      for (const value of values) { const dates = found.get(value) ?? new Set<string>(); dates.add(log.date); found.set(value, dates); }
    }
    return [...found].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  }
  const bowelDays = new Set(entries.filter(log => log.kind === 'bowel').map(log => log.date));
  return [
    {
      title: 'Patient Summary',
      trend,
      blocks: [{ lines: [
        ...(patient.name.trim() ? [`Patient: ${patient.name.trim()}`] : []),
        ...(patient.dob ? [`Date of birth: ${patient.dob}`] : []),
        `Report period: ${range.start || entries[0]?.date || 'Earliest entry'} to ${range.end || entries.at(-1)?.date || 'Latest entry'}`,
        'Summary of self-reported diary entries.',
        `Average daily pain on logged period days: ${formatted(painOn(periodDays))}`,
        `Average daily pain on other tracked days: ${formatted(painOn(new Set(days.filter(day => !periodDays.has(day)))))}`,
        'Period comparisons use explicitly logged period days. Missing entries are not symptom-free days.',
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
      ] }, { heading: 'Toilet & Pain', lines: [`Toilet entry days: ${bowelDays.size}`, `Average daily pain on toilet entry days: ${formatted(painOn(bowelDays))}`] },
      { heading: 'Symptom Frequency Overview', lines: frequency('symptoms').map(([label, dates]) => `${label}: ${dates.size} days; same-day average pain ${formatted(painOn(dates))}; peak recorded pain ${formatted(peakOn(dates))}; period-day average ${formatted(painOn(new Set([...dates].filter(date => periodDays.has(date)))))}`) },
      { heading: 'Pain Descriptors', lines: frequency('descriptors').map(([label, dates]) => `${label}: ${dates.size} days`) }],
    },
    {
      title: 'Patterns and Context',
      locations: frequency('locations', painLogs).map(([name, dates]) => ({ name, days: dates.size, percent: Math.round(dates.size / Math.max(1, new Set(painLogs.map(log => log.date)).size) * 100) })),
      blocks: [{ lines: [
        ...[...counts].map(([kind, count]) => `${titles[kind]} entries: ${count}`),
        ...patterns,
        ...frequency('locations', painLogs).map(([label, dates]) => `${label}: ${dates.size} of ${new Set(painLogs.map(log => log.date)).size} pain-tracking days`),
        ...frequency('foods', entries.filter(log => log.kind === 'food')).map(([label, dates]) => `${label}: ${dates.size} logged days; ${trend.filter(day => dates.has(day.date)).length} days with pain scores; same-day average pain ${formatted(painOn(dates))}`),
        'Same-day associations are descriptive and do not identify a trigger or cause.',
        ...(!entries.length ? ['No entries in this date range.'] : []),
      ] }],
    },
    {
      title: 'Daily Symptom Log',
      dailyRows: [...days].reverse().map(date => {
        const row: DailyRow = { date, pain: [], tracking: [], relief: [] };
        for (const entry of [...entries].reverse().filter(log => log.date === date)) {
          const destination = entry.kind === 'pain' ? row.pain : ['heat', 'tens', 'note'].includes(entry.kind) ? row.relief : row.tracking;
          destination.push(`${titles[entry.kind]} ${entry.time}`);
          for (const [key, value] of Object.entries(entry.fields)) {
            const display = Array.isArray(value) ? value.join(', ') : String(value);
            if (display.trim()) (key === 'medications' ? row.relief : destination).push(`${fieldLabel(key)}: ${display}${key === 'intensity' ? '/10' : ''}`);
          }
          if (entry.notes.trim()) row.relief.push(`Notes (${entry.time}): ${entry.notes}`);
          if (entry.attachment) row.relief.push('Attachment recorded in diary.');
        }
        return row;
      }),
      blocks: entries.length ? [...entries].reverse().map((entry) => ({
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

const htmlEscape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Native print engines preserve patient text in Unicode and paginate flowing diary rows. */
export function createReportHtml(sections: ReportSection[]) {
  function chart(trend: NonNullable<ReportSection['trend']>) {
    if (!trend.length) return '<p>No pain scores recorded for this period.</p>';
    const first = Date.parse(trend[0].date), last = Date.parse(trend.at(-1)!.date);
    const x = (date: string) => 35 + (Date.parse(date) - first) / Math.max(86400000, last - first) * 550;
    const y = (pain: number) => 160 - pain * 13;
    const marks = trend.map((point, i) => {
      const prev = trend[i - 1];
      const segment = prev && Date.parse(point.date) - Date.parse(prev.date) === 86400000
        ? `<line x1="${x(prev.date)}" y1="${y(prev.pain)}" x2="${x(point.date)}" y2="${y(point.pain)}" stroke="#ed6279" stroke-width="2"/>` : '';
      return `${point.period ? `<rect x="${x(point.date) - 4}" y="28" width="8" height="132" fill="#ffe0e5"/>` : ''}${segment}<circle cx="${x(point.date)}" cy="${y(point.pain)}" r="3" fill="#cf4165"/>`;
    }).join('');
    return `<h2>Pain Intensity Over Time</h2><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 195" role="img" aria-label="Daily average pain from zero to ten">${[0, 5, 10].map(n => `<text x="10" y="${y(n) + 4}" font-size="11" fill="#666">${n}</text><line x1="35" y1="${y(n)}" x2="585" y2="${y(n)}" stroke="#e7e7e7"/>`).join('')}${marks}<text x="35" y="185" font-size="11">${trend[0].date}</text><text x="585" y="185" text-anchor="end" font-size="11">${trend.at(-1)!.date}</text></svg><p class="caption">Daily mean of recorded pain scores. Pink bands mark logged period days. Gaps indicate days without a pain score.</p>`;
  }
  const paragraphs = (lines: string[]) => lines.length ? lines.map(line => `<p>${htmlEscape(line)}</p>`).join('') : '<p class="empty">—</p>';
  function dailyTable(rows: DailyRow[]) {
    return `<table class="diary"><colgroup><col style="width:14%"><col style="width:32%"><col style="width:24%"><col style="width:30%"></colgroup><thead><tr><th>Date</th><th>Pain and symptoms</th><th>Other tracking</th><th>Relief and notes</th></tr></thead><tbody>${rows.map(row => `<tr><td><strong>${htmlEscape(row.date)}</strong></td><td>${paragraphs(row.pain)}</td><td>${paragraphs(row.tracking)}</td><td>${paragraphs(row.relief)}</td></tr>`).join('')}</tbody></table>`;
  }
  function locationsOverview(locations: NonNullable<ReportSection['locations']>) {
    return `<h2>Pain Locations</h2><p class="caption">Percentage of distinct days with pain tracking.</p><div class="locations"><div class="location-bars">${locations.length ? locations.map(location => `<div class="location"><div>${htmlEscape(location.name)} <strong>${location.percent}%</strong></div><div class="track"><div style="width:${location.percent}%"></div></div><small>${location.days} logged days</small></div>`).join('') : '<p>No locations recorded.</p>'}</div></div>`;
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Endolog Diary Report</title><style>
    @page { size: A4; margin: 17mm 16mm; } * { box-sizing: border-box; } body { font: 11pt -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #30313a; margin: 0; } section { break-before: page; } section:first-child { break-before: auto; } h1 { font-size: 27pt; font-weight: 650; color: #292730; margin: 0 0 23px; border-bottom: 2px solid #ef738c; padding-bottom: 17px; } h2 { font-size: 14pt; margin: 22px 0 10px; } .block { padding: 13px 15px; background: #faf7f8; border-radius: 9px; margin-bottom: 12px; break-inside: avoid; } .block p { margin: 5px 0; line-height: 1.5; overflow-wrap: anywhere; } .daily .block { border-bottom: 1px solid #e7dfe2; border-radius: 0; background: white; padding: 12px 0; } .daily h2 { font-size: 11pt; margin-top: 0; color: #8c3652; } svg { width: 100%; } .caption, footer { font-size: 9pt; color: #6a6267; line-height: 1.45; } footer { border-top: 1px solid #eee; margin-top: 24px; padding-top: 10px; } .empty { color: #777; } table { width: 100%; border-collapse: collapse; table-layout: fixed; } thead { display: table-header-group; } th { text-align: left; text-transform: uppercase; font-size: 8pt; letter-spacing: .4px; padding: 11px 8px; background: #f7f3f5; color: #68616a; } td { vertical-align: top; padding: 12px 8px; border-bottom: 1px solid #e7e1e5; font-size: 9pt; overflow-wrap: anywhere; } td p { margin: 0 0 6px; line-height: 1.45; } tr { break-inside: avoid; } .locations { display: flex; align-items: center; gap: 28px; margin-bottom: 24px; } .location-bars { flex: 1; } .location { margin: 12px 0; font-size: 10pt; } .location strong { float: right; } .track { height: 7px; background: #f2e9ed; margin: 5px 0; border-radius: 4px; overflow: hidden; } .track div { height: 7px; background: #eb7790; } .location small { color: #777; font-size: 8pt; }
  </style></head><body>${sections.map(section => `<section class="${section.title === 'Daily Symptom Log' ? 'daily' : ''}"><h1>${htmlEscape(section.title)}</h1>${section.title === 'Daily Symptom Log' ? '<p class="caption">Most recent entries first. All values are self-reported.</p>' : ''}${section.locations ? locationsOverview(section.locations) : ''}${section.dailyRows?.length ? dailyTable(section.dailyRows) : section.blocks.map(block => `<div class="block">${block.heading ? `<h2>${htmlEscape(block.heading)}</h2>` : ''}${block.lines.length ? block.lines.map(line => `<p>${htmlEscape(line)}</p>`).join('') : '<p class="empty">Not recorded.</p>'}</div>`).join('')}${section.trend ? chart(section.trend) : ''}<footer>Endolog diary report · For informational and tracking purposes only.<br>Missing entries are not evidence of absent symptoms. Review before sharing.</footer></section>`).join('')}</body></html>`;
}
