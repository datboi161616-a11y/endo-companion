export type Entry={date:string;pain:number;flow:string;symptoms:string[];medications:string;notes:string;mood:string;sleep:number};
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const upsert=(entries:Entry[],entry:Entry)=>[...entries.filter(e=>e.date!==entry.date),entry].sort((a,b)=>b.date.localeCompare(a.date));
export function monthDays(year:number,month:number){return [...Array(new Date(year,month,1).getDay()).fill(null),...Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=>i+1)] as (number|null)[]}
export function csv(entries:Entry[]){return [['Date','Pain (0-10)','Flow','Symptoms','Medication / relief','Notes','Mood','Sleep hours'],...entries.map(e=>[e.date,e.pain,e.flow,e.symptoms.join('; '),e.medications,e.notes,e.mood,e.sleep])].map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n')}
export function parseBackup(raw:string):Entry[]{const value=JSON.parse(raw);if(!Array.isArray(value)||!value.every(e=>e&&typeof e.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&localDate(new Date(e.date+'T12:00:00'))===e.date&&Number.isInteger(e.pain)&&e.pain>=0&&e.pain<=10&&typeof e.flow==='string'&&Array.isArray(e.symptoms)&&e.symptoms.every((s:unknown)=>typeof s==='string')&&typeof e.medications==='string'&&typeof e.notes==='string'&&typeof e.mood==='string'&&typeof e.sleep==='number'&&e.sleep>=0&&e.sleep<=24))throw new Error('Invalid backup file');return value.reduce((all:Entry[],e:Entry)=>upsert(all,e),[])}

export function calendarDates(year: number, month: number): string[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const count = Math.ceil((firstWeekday + new Date(year, month + 1, 0).getDate()) / 7) * 7;

  return Array.from({length: count}, (_, index) =>
    localDate(new Date(year, month, index + 1 - firstWeekday))
  );
}
