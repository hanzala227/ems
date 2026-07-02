import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ZoomIn, ZoomOut, Search } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { listMyApplications } from '../../api/application.api'
import useFloorPlan from '../../hooks/useFloorPlan'
import Badge from '../../components/ui/Badge/Badge'
import Modal from '../../components/ui/Modal/Modal'
import Button from '../../components/ui/Button/Button'
import styles from './ExhFloorPlanViewerPage.module.css'

const STATUS_COLOR = {
  available: { bg: 'rgba(34,197,94,0.1)',   border: '#22c55e44', color: '#22c55e' },
  occupied:  { bg: 'rgba(13,148,136,0.15)', border: '#0d9488',   color: '#0d9488' },
  reserved:  { bg: 'rgba(124,92,191,0.15)', border: '#7c5cbf',   color: '#9b74d4' },
  pending:   { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b44', color: '#f59e0b' },
  blocked:   { bg: 'rgba(37,40,54,0.5)',    border: '#252836',   color: '#5a5e72' },
}

function FloorPlanView({ expoId }) {
  const [search, setSearch] = useState('')
  const [selectedBooth, setSelectedBooth] = useState(null)

  const {
    halls, activeHallId, booths, zoom, isLive, loading,
    setActiveHall, setZoom,
  } = useFloorPlan(expoId, 'view')

  const activeHall = halls.find(h => h._id === activeHallId)
  const rows = activeHall?.rows || 0
  const cols = activeHall?.columns || 0
  const boothList = Object.values(booths)
  const boothMap = {}
  boothList.forEach(b => { boothMap[`${b.row}-${b.col}`] = b })

  const filteredBooths = search
    ? boothList.filter(b =>
        b.boothNumber?.toLowerCase().includes(search.toLowerCase()) ||
        b.exhibitorId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.exhibitorId?.company?.toLowerCase().includes(search.toLowerCase())
      )
    : null

  return (
    <div className={styles.viewerBody}>
      {/* Controls */}
      <div className={styles.controls}>
        {halls.length > 0 && (
          <div className={styles.hallTabs}>
            {halls.map(h => (
              <button key={h._id} className={`${styles.hallTab} ${activeHallId === h._id ? styles.activeHall : ''}`}
                onClick={() => setActiveHall(h._id)}>
                {h.name}
              </button>
            ))}
          </div>
        )}
        <div className={styles.rightControls}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search booths or exhibitors..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.zoomBtns}>
            <button className={styles.zoomBtn} onClick={() => setZoom(zoom + 0.1)}><ZoomIn size={15}/></button>
            <span className={styles.zoomVal}>{Math.round(zoom * 100)}%</span>
            <button className={styles.zoomBtn} onClick={() => setZoom(zoom - 0.1)}><ZoomOut size={15}/></button>
          </div>
          <div className={styles.liveBadge}>
            <span className={`${styles.liveDot} ${isLive ? styles.liveActive : ''}`} />
            {isLive ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      {loading ? <Skeleton height={360} /> : !halls.length ? (
        <div className={styles.empty}>Floor plan not available for this expo yet.</div>
      ) : (
        <div className={styles.canvasWrap}>
          <div className={styles.canvasScroll}>
            <div className={styles.grid} style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              gridTemplateColumns: `repeat(${cols}, 76px)`,
              gridTemplateRows: `repeat(${rows}, 76px)`,
            }}>
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const booth = boothMap[`${r + 1}-${c + 1}`]
                  const st = booth?.status || 'available'
                  const clr = STATUS_COLOR[st]
                  const highlighted = filteredBooths && booth && filteredBooths.some(b => b._id === booth._id)
                  const dimmed = filteredBooths && booth && !highlighted
                  return (
                    <div key={`${r}-${c}`}
                      className={styles.cell}
                      style={{
                        background: clr.bg,
                        border: `1px solid ${highlighted ? '#fff' : clr.border}`,
                        opacity: dimmed ? 0.25 : 1,
                        cursor: booth?.exhibitorId ? 'pointer' : 'default',
                      }}
                      onClick={() => booth?.exhibitorId && setSelectedBooth(booth)}
                    >
                      {booth && (
                        <>
                          <span className={styles.cellNum} style={{ color: clr.color }}>{booth.boothNumber}</span>
                          {booth.exhibitorId && (
                            <span className={styles.cellTenant}>
                              {booth.exhibitorId.company || booth.exhibitorId.name}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        {['occupied', 'reserved', 'available', 'blocked'].map(st => (
          <div key={st} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: STATUS_COLOR[st].color }} />
            <span>{st.charAt(0).toUpperCase() + st.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Booth popup */}
      {selectedBooth && (
        <Modal isOpen={!!selectedBooth} onClose={() => setSelectedBooth(null)} title={`Booth ${selectedBooth.boothNumber}`}
          footer={<Button variant="secondary" onClick={() => setSelectedBooth(null)}>Close</Button>}>
          <div className={styles.boothPopup}>
            {selectedBooth.exhibitorId?.companyLogo && (
              <img src={selectedBooth.exhibitorId.companyLogo} alt="" className={styles.exhibitorLogo} />
            )}
            <p className={styles.exhibitorName}>{selectedBooth.exhibitorId?.company || selectedBooth.exhibitorId?.name}</p>
            {selectedBooth.exhibitorId?.industry && <p className={styles.exhibitorIndustry}>{selectedBooth.exhibitorId.industry}</p>}
            {selectedBooth.exhibitorId?.bio && <p className={styles.exhibitorBio}>{selectedBooth.exhibitorId.bio}</p>}
            <div className={styles.boothMeta}>
              <span>Booth: {selectedBooth.boothNumber}</span>
              <Badge variant={selectedBooth.status}>{selectedBooth.status}</Badge>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function ExhFloorPlanViewerPage() {
  const [selectedExpoId, setSelectedExpoId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'my'],
    queryFn: () => listMyApplications().then(r => r.data.data),
  })

  const applications = data?.applications || []
  const activeExpos = applications.filter(a => a.status === 'approved' && (a.expoId?.status === 'Published' || a.expoId?.status === 'Live'))
  const currentExpoId = selectedExpoId || activeExpos[0]?.expoId?._id

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Floor Plan Viewer</h1>
      <p className={styles.sub}>Explore booth layouts for expos you are approved for</p>

      {isLoading ? <Skeleton height={48} /> :
       !activeExpos.length ? (
        <div className={styles.empty}>
          <p>You have no approved applications for active expos yet. <Link to="/exhibitor/expos">Browse expos →</Link></p>
        </div>
      ) : (
        <>
          {activeExpos.length > 1 && (
            <div className={styles.expoSelector}>
              {activeExpos.map(app => (
                <button key={app.expoId?._id}
                  className={`${styles.expoTab} ${currentExpoId === app.expoId?._id ? styles.activeExpo : ''}`}
                  onClick={() => setSelectedExpoId(app.expoId?._id)}>
                  {app.expoId?.name}
                </button>
              ))}
            </div>
          )}
          {currentExpoId && <FloorPlanView expoId={currentExpoId} />}
        </>
      )}
    </div>
  )
}
