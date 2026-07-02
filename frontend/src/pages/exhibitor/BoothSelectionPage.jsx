import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  MapPin, CheckCircle, ChevronLeft, ZoomIn, ZoomOut,
  Info, Store, Grid3X3, ArrowRight, Building2, AlertCircle
} from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import * as hallApi from '../../api/hall.api'
import * as boothApi from '../../api/booth.api'
import { getExpo } from '../../api/expo.api'
import Badge from '../../components/ui/Badge/Badge'
import Button from '../../components/ui/Button/Button'
import Modal from '../../components/ui/Modal/Modal'
import styles from './BoothSelectionPage.module.css'

const CELL_SIZE = 72

const STATUS_COLORS = {
  available: { bg: 'rgba(34,197,94,0.12)',  border: '#22c55e', color: '#22c55e', label: 'Available' },
  occupied:  { bg: 'rgba(13,148,136,0.12)', border: '#0d9488', color: '#0d9488', label: 'Occupied'  },
  reserved:  { bg: 'rgba(124,92,191,0.12)', border: '#7c5cbf', color: '#7c5cbf', label: 'Reserved'  },
  pending:   { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', color: '#f59e0b', label: 'Pending'   },
  blocked:   { bg: 'rgba(107,114,128,0.12)',border: '#6b7280', color: '#6b7280', label: 'Blocked'   },
}

export default function BoothSelectionPage() {
  const { expoId } = useParams()
  const navigate   = useNavigate()
  const qc         = useQueryClient()

  const [activeHallId, setActiveHallId] = useState(null)
  const [selectedBoothId, setSelectedBoothId] = useState(null)
  const [zoom, setZoom]     = useState(1)
  const [panX, setPanX]     = useState(20)
  const [panY, setPanY]     = useState(20)
  const [showGrid, setShowGrid] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const wrapperRef = useRef(null)
  const panRef     = useRef(null)

  // Fetch expo info
  const { data: expoData } = useQuery({
    queryKey: ['expo', expoId],
    queryFn: () => getExpo(expoId).then(r => r.data.data),
    enabled: !!expoId,
  })

  // Fetch halls
  const { data: hallsData, isLoading: hallsLoading } = useQuery({
    queryKey: ['halls', expoId],
    queryFn: () => hallApi.listHallsByExpo(expoId).then(r => r.data.data),
    enabled: !!expoId,
    onSuccess: (d) => {
      if (d?.halls?.length && !activeHallId) setActiveHallId(d.halls[0]._id)
    },
  })

  const halls = hallsData?.halls || []

  useEffect(() => {
    if (halls.length && !activeHallId) setActiveHallId(halls[0]._id)
  }, [halls, activeHallId])

  // Fetch booths for active hall
  const { data: boothsData, isLoading: boothsLoading } = useQuery({
    queryKey: ['booths', activeHallId],
    queryFn: () => boothApi.listBoothsByHall(activeHallId).then(r => r.data.data),
    enabled: !!activeHallId,
  })

  const booths = boothsData?.booths || []
  const activeHall = halls.find(h => h._id === activeHallId)
  const rows = activeHall?.rows || 0
  const cols = activeHall?.columns || 0

  const boothMap = {}
  booths.forEach(b => { boothMap[`${b.row}-${b.col}`] = b })

  const selectedBooth = booths.find(b => b._id === selectedBoothId)

  // Select booth mutation
  const selectMutation = useMutation({
    mutationFn: (boothId) => boothApi.selectBooth(boothId),
    onSuccess: () => {
      toast.success('Booth request submitted! The organizer will be notified.')
      qc.invalidateQueries(['booths', activeHallId])
      setConfirmOpen(false)
      setSelectedBoothId(null)
      setTimeout(() => navigate('/exhibitor/applications'), 1500)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to select booth'),
  })

  // Pan handler
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 1 && !e.altKey) return
    e.preventDefault()
    panRef.current = { startX: e.clientX - panX, startY: e.clientY - panY }
    const onMove = (ev) => {
      if (!panRef.current) return
      setPanX(ev.clientX - panRef.current.startX)
      setPanY(ev.clientY - panRef.current.startY)
    }
    const onUp = () => { panRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [panX, panY])

  // Wheel zoom
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom(z => Math.min(2.5, Math.max(0.3, z + (e.deltaY > 0 ? -0.1 : 0.1))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const expo = expoData?.expo

  const availableCount = booths.filter(b => b.status === 'available').length

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────── */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/exhibitor/applications" className={styles.backBtn}>
          <ChevronLeft size={16} /> Applications
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Select Your Booth</h1>
          <p className={styles.sub}>
            {expo?.name ? `Choosing a booth for: ${expo.name}` : 'Loading expo...'}
          </p>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.metaPill}>
            <Store size={13} />
            <span>{availableCount} available</span>
          </div>
        </div>
      </motion.div>

      {/* ── Info Banner ─────────────────────────────────── */}
      <motion.div
        className={styles.infoBanner}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AlertCircle size={15} className={styles.infoIcon} />
        <span>
          Click on a <strong>green (available)</strong> booth to select it.
          Your request will be sent to the organizer for final approval.
        </span>
      </motion.div>

      {/* ── Main layout ─────────────────────────────────── */}
      <div className={styles.layout}>
        {/* ── Floor plan panel ─────────────────────────── */}
        <motion.div
          className={styles.planPanel}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
        >
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.hallTabs}>
              {hallsLoading
                ? <Skeleton width={120} height={28} />
                : halls.map(h => (
                  <button
                    key={h._id}
                    className={`${styles.hallTab} ${activeHallId === h._id ? styles.activeHall : ''}`}
                    onClick={() => setActiveHallId(h._id)}
                  >
                    <Building2 size={12} />
                    {h.name}
                    <span className={styles.hallDim}>{h.rows}×{h.columns}</span>
                  </button>
                ))
              }
            </div>
            <div className={styles.toolbarRight}>
              <button className={`${styles.toolBtn} ${showGrid ? styles.activeTool : ''}`} onClick={() => setShowGrid(v => !v)} title="Toggle grid">
                <Grid3X3 size={14} />
              </button>
              <button className={styles.toolBtn} onClick={() => setZoom(z => Math.max(0.3, z - 0.12))} title="Zoom out"><ZoomOut size={14} /></button>
              <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
              <button className={styles.toolBtn} onClick={() => setZoom(z => Math.min(2.5, z + 0.12))} title="Zoom in"><ZoomIn size={14} /></button>
              <button className={styles.toolBtn} onClick={() => setZoom(1)} title="Reset zoom" style={{ fontSize: 10, fontWeight: 700, width: 30 }}>1:1</button>
            </div>
          </div>

          {/* Canvas area */}
          <div
            ref={wrapperRef}
            className={styles.canvasWrapper}
            onMouseDown={handleMouseDown}
          >
            {(hallsLoading || boothsLoading) ? (
              <div className={styles.skeletonWrap}>
                <Skeleton height={360} borderRadius={12} />
              </div>
            ) : !halls.length ? (
              <div className={styles.emptyCanvas}>
                <MapPin size={48} />
                <h3>No halls configured</h3>
                <p>The organizer hasn't set up the floor plan yet.</p>
              </div>
            ) : (
              <div
                className={styles.canvas}
                style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' }}
              >
                {showGrid && (
                  <div className={styles.gridBg} style={{
                    width: cols * CELL_SIZE + 1,
                    height: rows * CELL_SIZE + 1,
                    backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
                  }} />
                )}
                {Array.from({ length: rows }, (_, r) =>
                  Array.from({ length: cols }, (_, c) => {
                    const row = r + 1
                    const col = c + 1
                    const booth = boothMap[`${row}-${col}`]
                    const isAvailable = booth?.status === 'available'
                    const isSelected  = booth?._id === selectedBoothId
                    const clr = STATUS_COLORS[booth?.status || 'available']

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`${styles.cell}
                          ${!booth ? styles.emptyCell : ''}
                          ${isAvailable ? styles.availableCell : ''}
                          ${isSelected ? styles.selectedCell : ''}
                        `}
                        style={{
                          left: (col - 1) * CELL_SIZE,
                          top:  (row - 1) * CELL_SIZE,
                          width:  CELL_SIZE - 3,
                          height: CELL_SIZE - 3,
                          background: isSelected ? 'rgba(124,92,191,0.22)' : booth ? clr.bg : 'transparent',
                          border: `1.5px solid ${isSelected ? '#9b74d4' : booth ? clr.border : 'transparent'}`,
                          boxShadow: isSelected ? '0 0 0 2px rgba(124,92,191,0.5), 0 4px 20px rgba(124,92,191,0.3)' : isAvailable ? `0 0 12px ${clr.border}22` : 'none',
                          cursor: isAvailable ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (!isAvailable) return
                          setSelectedBoothId(booth._id === selectedBoothId ? null : booth._id)
                        }}
                      >
                        {booth && (
                          <div className={styles.cellContent}>
                            <span className={styles.cellNum} style={{ color: isSelected ? '#c4a8f0' : clr.color }}>
                              {booth.boothNumber}
                            </span>
                            {booth.exhibitorId && (
                              <span className={styles.cellTenant}>
                                {booth.exhibitorId.company || booth.exhibitorId.name}
                              </span>
                            )}
                            {isAvailable && !isSelected && (
                              <span className={styles.cellAvailBadge}>Select</span>
                            )}
                            {isSelected && (
                              <CheckCircle size={14} className={styles.cellCheck} />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            {Object.entries(STATUS_COLORS).map(([st, clr]) => (
              <div key={st} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: clr.border }} />
                <span>{clr.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Side panel ────────────────────────────────── */}
        <motion.div
          className={styles.sidePanel}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Expo info */}
          {expo && (
            <div className={styles.expoCard}>
              <div className={styles.expoBanner}>
                {expo.bannerImage
                  ? <img src={expo.bannerImage} alt={expo.name} />
                  : <div className={styles.bannerFallback}><Building2 size={24} /></div>
                }
                <Badge variant={expo.status?.toLowerCase()} className={styles.expoBadge}>{expo.status}</Badge>
              </div>
              <div className={styles.expoBody}>
                <h3 className={styles.expoName}>{expo.name}</h3>
                {expo.location?.city && (
                  <p className={styles.expoLoc}><MapPin size={11} /> {expo.location.city}, {expo.location.country}</p>
                )}
              </div>
            </div>
          )}

          {/* Selected booth panel */}
          <AnimatePresence>
            {selectedBooth ? (
              <motion.div
                className={styles.selectedPanel}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
              >
                <div className={styles.selectedHeader}>
                  <CheckCircle size={16} className={styles.selectedCheck} />
                  <span>Booth Selected</span>
                </div>
                <div className={styles.boothDetails}>
                  <div className={styles.boothDetailRow}>
                    <span className={styles.detailLabel}>Booth Number</span>
                    <span className={styles.detailValue}>{selectedBooth.boothNumber}</span>
                  </div>
                  <div className={styles.boothDetailRow}>
                    <span className={styles.detailLabel}>Status</span>
                    <Badge variant={selectedBooth.status}>{selectedBooth.status}</Badge>
                  </div>
                  <div className={styles.boothDetailRow}>
                    <span className={styles.detailLabel}>Size</span>
                    <span className={styles.detailValue}>{selectedBooth.width}×{selectedBooth.height} units</span>
                  </div>
                  <div className={styles.boothDetailRow}>
                    <span className={styles.detailLabel}>Position</span>
                    <span className={styles.detailValue}>Row {selectedBooth.row}, Col {selectedBooth.col}</span>
                  </div>
                  {selectedBooth.price > 0 && (
                    <div className={styles.boothDetailRow}>
                      <span className={styles.detailLabel}>Price</span>
                      <span className={styles.detailValue}>${selectedBooth.price.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBooth.notes && (
                    <div className={styles.boothNotes}>
                      <Info size={12} />
                      <span>{selectedBooth.notes}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={() => setConfirmOpen(true)}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  Request This Booth <ArrowRight size={14} />
                </Button>
                <button className={styles.clearBtn} onClick={() => setSelectedBoothId(null)}>
                  Clear Selection
                </button>
              </motion.div>
            ) : (
              <motion.div
                className={styles.noSelection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MapPin size={32} className={styles.noSelIcon} />
                <p>Click a <strong>green booth</strong> on the floor plan to select it</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hall stats */}
          {activeHall && (
            <div className={styles.hallStats}>
              <div className={styles.hallStatRow}>
                <span>Total Booths</span><strong>{booths.length}</strong>
              </div>
              <div className={styles.hallStatRow}>
                <span>Available</span>
                <strong style={{ color: 'var(--color-success)' }}>{booths.filter(b => b.status === 'available').length}</strong>
              </div>
              <div className={styles.hallStatRow}>
                <span>Occupied</span>
                <strong style={{ color: 'var(--color-teal)' }}>{booths.filter(b => b.status === 'occupied').length}</strong>
              </div>
              <div className={styles.hallStatRow}>
                <span>Pending</span>
                <strong style={{ color: 'var(--color-warning)' }}>{booths.filter(b => b.status === 'pending').length}</strong>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Confirm Modal ─────────────────────────────────── */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Booth Selection"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={selectMutation.isPending}
              onClick={() => selectMutation.mutate(selectedBoothId)}
            >
              Confirm Request
            </Button>
          </>
        }
      >
        <div className={styles.confirmBody}>
          <div className={styles.confirmIcon}>
            <Store size={28} />
          </div>
          <p className={styles.confirmText}>
            You're requesting <strong>Booth {selectedBooth?.boothNumber}</strong>.
          </p>
          <p className={styles.confirmSub}>
            The organizer will review your request and confirm or suggest an alternative.
            Your booth status will show as <strong>Pending</strong> until approved.
          </p>
        </div>
      </Modal>
    </div>
  )
}
