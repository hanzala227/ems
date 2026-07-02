import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { MapPin, Hash, Maximize2, DollarSign, Store } from 'lucide-react'
import { listMyBooths } from '../../api/booth.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './MyBoothPage.module.css'

export default function MyBoothPage() {
  const { data: boothsData, isLoading } = useQuery({
    queryKey: ['booths', 'my'],
    queryFn: () => listMyBooths().then(r => r.data.data),
  })

  const booths = boothsData?.booths || []

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Booths</h1>
      <p className={styles.sub}>Your assigned booths and pending requests</p>

      {isLoading ? <Skeleton count={3} height={140} style={{ marginBottom: 16 }} /> :
       !booths.length ? (
        <div className={styles.empty}>
          <Store size={40} />
          <h3>No booths yet</h3>
          <p>Once you select a booth or an organizer assigns one, it will appear here.</p>
          <Link to="/exhibitor/applications" className={styles.browseLink} style={{ color: 'var(--color-primary)', marginTop: 12, display: 'inline-block' }}>Go to Applications →</Link>
        </div>
      ) : (
        <div className={styles.expoList}>
          {booths.map(booth => (
            <div key={booth._id} className={styles.expoSection}>
              <div className={styles.expoHeader}>
                <div className={styles.expoBanner}>
                  {booth.expoId?.bannerImage ? <img src={booth.expoId.bannerImage} alt="" /> : booth.expoId?.name?.[0]}
                </div>
                <div>
                  <h2 className={styles.expoName}>{booth.expoId?.name}</h2>
                  <p className={styles.expoLoc}>{booth.expoId?.location?.city}, {booth.expoId?.location?.country}</p>
                </div>
              </div>
              
              <div className={styles.boothCard}>
                <div className={styles.boothNum}>
                  <Hash size={20} />
                  <span>{booth.boothNumber}</span>
                </div>
                <div className={styles.boothDetails}>
                  <div className={styles.detailRow}>
                    <MapPin size={14} /> <span>Hall: {booth.hallId?.name || 'Unknown'} (Floor {booth.hallId?.floorNumber || 1})</span>
                  </div>
                  <div className={styles.detailRow}>
                    <Maximize2 size={14} /> <span>Size: {booth.width}×{booth.height} units</span>
                  </div>
                  {booth.price > 0 && (
                    <div className={styles.detailRow}>
                      <DollarSign size={14} /> <span>Price: ${booth.price}</span>
                    </div>
                  )}
                </div>
                <Badge variant={booth.status}>{booth.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
