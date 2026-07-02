import { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import useFloorPlan from '../../../hooks/useFloorPlan'
import styles from './FloorPlanPreview.module.css'

const STATUS_COLOR = {
  available: { bg: 'rgba(34, 197, 94, 0.15)',  border: 'rgba(34, 197, 94, 0.6)',  color: '#4ade80' },
  occupied:  { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.6)', color: '#60a5fa' },
  reserved:  { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.6)', color: '#c084fc' },
  pending:   { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.6)', color: '#fb923c' },
  blocked:   { bg: 'rgba(71, 85, 105, 0.2)',   border: 'rgba(71, 85, 105, 0.5)',  color: '#94a3b8' },
}

export default function FloorPlanPreview({ expoId, title = 'Floor Plan Layout', userRole = 'attendee' }) {
  const navigate = useNavigate()
  const [previewZoom, setPreviewZoom] = useState(0.7)

  const {
    halls,
    activeHallId,
    booths,
    loading,
    setActiveHall,
  } = useFloorPlan(expoId, 'view')

  const activeHall = halls.find((h) => h._id === activeHallId)
  const rows = activeHall?.rows || 0
  const cols = activeHall?.columns || 0
  const boothList = Object.values(booths)
  const boothMap = {}
  boothList.forEach((b) => {
    boothMap[`${b.row}-${b.col}`] = b
  })

  const handleMaximize = () => {
    if (userRole === 'organizer') {
      navigate(`/organizer/expos/${expoId}/floor-plan`)
    } else if (userRole === 'exhibitor') {
      navigate(`/exhibitor/booth-selection/${expoId}`)
    } else {
      navigate(`/attendee/floor-plan`)
    }
  }

  if (!expoId) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
        </div>
        <div className={styles.empty}>
          <Layers size={28} />
          <p>No active event selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>{title}</span>
        </div>
        <div className={styles.controls}>
          {halls.length > 0 && (
            <select
              className={styles.hallSelect}
              value={activeHallId || ''}
              onChange={(e) => setActiveHall(e.target.value)}
            >
              {halls.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          )}
          
          <div className={styles.zoomControls}>
            <button className={styles.controlBtn} onClick={() => setPreviewZoom(Math.max(0.4, previewZoom - 0.1))} title="Zoom Out">
              <ZoomOut size={13} />
            </button>
            <button className={styles.controlBtn} onClick={() => setPreviewZoom(Math.min(1.2, previewZoom + 0.1))} title="Zoom In">
              <ZoomIn size={13} />
            </button>
          </div>
          <button className={styles.maximizeBtn} onClick={handleMaximize} title="Open Interactive View">
            <Maximize2 size={13} />
          </button>

          <div className={styles.liveIndicator}>
            <div className={styles.liveDot} />
            Live
          </div>
        </div>
      </div>

      {/* Hall tabs if multiple */}
      {halls.length > 1 && (
        <div className={styles.hallTabs}>
          {halls.map((h) => (
            <button
              key={h._id}
              className={`${styles.hallTab} ${activeHallId === h._id ? styles.activeTab : ''}`}
              onClick={() => setActiveHall(h._id)}
            >
              {h.name}
            </button>
          ))}
        </div>
      )}

    <div className={styles.body}>
        {loading ? (
          <Skeleton height={200} borderRadius={8} />
        ) : !halls.length ? (
          <div className={styles.empty}>
            <Layers size={24} />
            <p>Floor plan not setup yet</p>
          </div>
        ) : (
          <div className={styles.canvasContainer}>
            <div
              className={styles.grid}
              style={{
                transform: `scale(${previewZoom})`,
                transformOrigin: 'top left',
                gridTemplateColumns: `repeat(${cols}, 50px)`,
                gridTemplateRows: `repeat(${rows}, 50px)`,
              }}
            >
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const booth = boothMap[`${r + 1}-${c + 1}`]
                  const st = booth?.status || 'available'
                  const clr = STATUS_COLOR[st]
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`${styles.cell} ${booth ? styles.boothCell : ''}`}
                      style={{
                        background: clr.bg,
                        borderColor: clr.border,
                        color: clr.color,
                      }}
                    >
                      {booth && (
                        <>
                          <div className={styles.cellContent}>
                            <span className={styles.cellNum}>{booth.boothNumber}</span>
                          </div>
                          <div className={styles.tooltip}>
                            <div className={styles.tooltipTitle}>Booth {booth.boothNumber}</div>
                            <div className={styles.tooltipRow}>
                              <span className={styles.tooltipLbl}>Status:</span> 
                              <span className={styles.tooltipVal} style={{ color: clr.color }}>
                                {st.charAt(0).toUpperCase() + st.slice(1)}
                              </span>
                            </div>
                            {booth.exhibitorId && (
                              <div className={styles.tooltipRow}>
                                <span className={styles.tooltipLbl}>Exhibitor:</span>
                                <span className={styles.tooltipVal}>{booth.exhibitorId.company || booth.exhibitorId.name}</span>
                              </div>
                            )}
                            <div className={styles.tooltipAction}>View Details</div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mini Legend */}
      <div className={styles.legend}>
        {['available', 'occupied', 'pending'].map((st) => (
          <div key={st} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: STATUS_COLOR[st].color }} />
            <span className={styles.legendText}>
              {st === 'available' ? 'Available' : st === 'occupied' ? 'Occupied' : 'Pending'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
