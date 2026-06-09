interface Props {
  data: number[]
  w?: number
  h?: number
  color?: string
}

export function Sparkline({ data, w = 80, h = 28, color = 'var(--accent)' }: Props) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const span = max - min || 1
  const step = w / (data.length - 1)
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / span) * h}`)
    .join(' ')

  const last = data[data.length - 1]
  const lastX = (data.length - 1) * step
  const lastY = h - ((last - min) / span) * h

  return (
    <svg width={w} height={h}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx={lastX} cy={lastY} r="2.2" fill={color} />
    </svg>
  )
}
