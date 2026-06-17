const LABELS: Record<string, string> = {
  AC: 'AC',
  WA: 'WA',
  TLE: 'TLE',
  MLE: 'MLE',
  RE: 'RE',
  CE: 'CE',
  pending: 'Pending',
  easy: 'Dễ',
  medium: 'Vừa',
  hard: 'Khó',
}

export default function Badge({ verdict }: { verdict: string }) {
  const cls = verdict.toLowerCase()
  return <span className={`badge ${cls}`}>{LABELS[verdict] ?? verdict}</span>
}
