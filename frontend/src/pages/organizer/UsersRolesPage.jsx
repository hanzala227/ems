import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { searchUsers } from '../../api/user.api'
import Badge from '../../components/ui/Badge/Badge'
import styles from './UsersRolesPage.module.css'

const ROLE_FILTERS = ['all', 'organizer', 'exhibitor', 'attendee']

export default function UsersRolesPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'search', search, roleFilter],
    queryFn: () => searchUsers(search || 'a').then(r => r.data.data),
    enabled: true,
  })

  const users = (data?.users || []).filter(u => roleFilter === 'all' || u.role === roleFilter)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users & Roles</h1>
          <p className={styles.sub}>Search and view users across the platform</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput}
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.roleTabs}>
          {ROLE_FILTERS.map(r => (
            <button key={r}
              className={`${styles.roleTab} ${roleFilter === r ? styles.activeRoleTab : ''}`}
              onClick={() => setRoleFilter(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        {isLoading ? <Skeleton count={5} height={56} style={{ marginBottom: 8 }} /> :
         !users.length ? (
          <div className={styles.empty}>
            <Search size={36} />
            <p>No users found. Try a different search term.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>User</th><th>Role</th><th>Company</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {user.avatar ? <img src={user.avatar} alt="" /> : user.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><Badge variant={user.role}>{user.role}</Badge></td>
                  <td className={styles.muted}>{user.company || '—'}</td>
                  <td className={styles.muted}>{user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
