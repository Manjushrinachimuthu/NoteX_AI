import { useMemo } from 'react'
import './FloatingIcons.css'

const ICONS = [
  // Notebook / spiral
  (op) => (
    <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: op }}>
      <rect x="10" y="4" width="34" height="48" rx="3" stroke="white" strokeWidth="1.4" fill="none"/>
      {/* Spiral rings */}
      {[10,18,26,34,42].map(y => (
        <g key={y}>
          <circle cx="10" cy={y} r="3" stroke="white" strokeWidth="1.2" fill="none"/>
          <line x1="4" y1={y} x2="10" y2={y} stroke="white" strokeWidth="1"/>
        </g>
      ))}
      {/* Lines */}
      <line x1="16" y1="16" x2="38" y2="16" stroke="white" strokeWidth="1"/>
      <line x1="16" y1="22" x2="38" y2="22" stroke="white" strokeWidth="1"/>
      <line x1="16" y1="28" x2="38" y2="28" stroke="white" strokeWidth="1"/>
      <line x1="16" y1="34" x2="30" y2="34" stroke="white" strokeWidth="1"/>
    </svg>
  ),
  // Ballpoint pen
  (op) => (
    <svg viewBox="0 0 14 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: op }}>
      <rect x="3" y="2" width="8" height="36" rx="4" stroke="white" strokeWidth="1.3" fill="none"/>
      <rect x="4" y="2" width="6" height="6" rx="2" stroke="white" strokeWidth="1.1" fill="none"/>
      <path d="M3 38 L7 54 L11 38Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <circle cx="7" cy="54" r="1" fill="white" opacity="0.6"/>
      <line x1="3" y1="14" x2="11" y2="14" stroke="white" strokeWidth="0.8"/>
    </svg>
  ),
  // Pencil
  (op) => (
    <svg viewBox="0 0 12 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: op }}>
      <rect x="2" y="6" width="8" height="38" stroke="white" strokeWidth="1.3" fill="none"/>
      <rect x="2" y="2" width="8" height="7" rx="1" stroke="white" strokeWidth="1.1" fill="none"/>
      <path d="M2 44 L6 54 L10 44Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <line x1="2" y1="44" x2="10" y2="44" stroke="white" strokeWidth="1"/>
      <line x1="5" y1="44" x2="6" y2="54" stroke="white" strokeWidth="0.7"/>
    </svg>
  ),
  // Open book
  (op) => (
    <svg viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: op }}>
      <path d="M26 8 Q14 4 4 6 L4 36 Q14 34 26 38Z" stroke="white" strokeWidth="1.3" fill="none"/>
      <path d="M26 8 Q38 4 48 6 L48 36 Q38 34 26 38Z" stroke="white" strokeWidth="1.3" fill="none"/>
      <line x1="26" y1="8" x2="26" y2="38" stroke="white" strokeWidth="1"/>
      <line x1="8"  y1="14" x2="22" y2="13" stroke="white" strokeWidth="0.8"/>
      <line x1="8"  y1="19" x2="22" y2="18" stroke="white" strokeWidth="0.8"/>
      <line x1="8"  y1="24" x2="22" y2="23" stroke="white" strokeWidth="0.8"/>
      <line x1="30" y1="14" x2="44" y2="13" stroke="white" strokeWidth="0.8"/>
      <line x1="30" y1="19" x2="44" y2="18" stroke="white" strokeWidth="0.8"/>
      <line x1="30" y1="24" x2="44" y2="23" stroke="white" strokeWidth="0.8"/>
    </svg>
  ),
  // Fountain pen
  (op) => (
    <svg viewBox="0 0 16 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: op }}>
      <rect x="3" y="2" width="10" height="10" rx="5" stroke="white" strokeWidth="1.3" fill="none"/>
      <rect x="4" y="11" width="8" height="28" rx="1" stroke="white" strokeWidth="1.2" fill="none"/>
      <path d="M4 39 L8 58 L12 39Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <line x1="6" y1="48" x2="10" y2="48" stroke="white" strokeWidth="0.7"/>
      <line x1="4" y1="20" x2="12" y2="20" stroke="white" strokeWidth="0.8"/>
    </svg>
  ),
  // Notepad with lines
  (op) => (
    <svg viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: op }}>
      <rect x="4" y="8" width="36" height="42" rx="3" stroke="white" strokeWidth="1.4" fill="none"/>
      <rect x="14" y="2" width="16" height="10" rx="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <line x1="10" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1"/>
      <line x1="10" y1="27" x2="34" y2="27" stroke="white" strokeWidth="1"/>
      <line x1="10" y1="34" x2="34" y2="34" stroke="white" strokeWidth="1"/>
      <line x1="10" y1="41" x2="24" y2="41" stroke="white" strokeWidth="1"/>
    </svg>
  ),
  // Marker / highlighter
  (op) => (
    <svg viewBox="0 0 16 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: op }}>
      <rect x="2" y="4" width="12" height="32" rx="6" stroke="white" strokeWidth="1.3" fill="none"/>
      <rect x="4" y="2" width="8" height="6" rx="2" stroke="white" strokeWidth="1.1" fill="none"/>
      <rect x="4" y="36" width="8" height="8" rx="1" stroke="white" strokeWidth="1.1" fill="none"/>
      <path d="M4 44 L8 50 L12 44" stroke="white" strokeWidth="1.2" fill="none"/>
    </svg>
  ),
  // Clipboard
  (op) => (
    <svg viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: op }}>
      <rect x="4" y="8" width="36" height="42" rx="2" stroke="white" strokeWidth="1.4" fill="none"/>
      <rect x="14" y="4" width="16" height="9" rx="2" stroke="white" strokeWidth="1.3" fill="none"/>
      <line x1="10" y1="22" x2="34" y2="22" stroke="white" strokeWidth="1"/>
      <line x1="10" y1="29" x2="34" y2="29" stroke="white" strokeWidth="1"/>
      <line x1="10" y1="36" x2="34" y2="36" stroke="white" strokeWidth="1"/>
      <line x1="10" y1="43" x2="22" y2="43" stroke="white" strokeWidth="1"/>
    </svg>
  ),
]

const FloatingIcons = () => {
  const items = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id:        i,
      iconIdx:   i % ICONS.length,
      size:      30 + Math.random() * 50,
      top:       Math.random() * 92,
      left:      Math.random() * 92,
      opacity:   0.06 + Math.random() * 0.1,
      duration:  20 + Math.random() * 25,
      delay:     -(Math.random() * 25),
      rotate:    Math.random() * 360,
      rotateDur: 35 + Math.random() * 50,
    }))
  }, [])

  return (
    <div className="floating-icons-layer" aria-hidden="true">
      {items.map(item => (
        <div
          key={item.id}
          className="floating-icon"
          style={{
            width:              item.size,
            height:             item.size,
            top:                `${item.top}%`,
            left:               `${item.left}%`,
            animationDuration:  `${item.duration}s, ${item.rotateDur}s`,
            animationDelay:     `${item.delay}s, ${item.delay * 0.5}s`,
            '--init-rotate':    `${item.rotate}deg`,
          }}
        >
          {ICONS[item.iconIdx](item.opacity)}
        </div>
      ))}
    </div>
  )
}

export default FloatingIcons
