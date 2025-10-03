import { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>
}

export function Alert({ children }: { children: ReactNode }) {
  return <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: 12, borderRadius: 8 }}>{children}</div>
}

export function Loader({ label = 'Loading...' }: { label?: string }) {
  return <div style={{ color: '#94a3b8' }}>{label}</div>
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        maxWidth: 320,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text)'
      }}
    />
  )
}


