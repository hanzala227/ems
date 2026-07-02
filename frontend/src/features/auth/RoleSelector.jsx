import clsx from 'clsx'
import styles from './RoleSelector.module.css'

const roles = [
  {
    value: 'organizer',
    label: 'Organizer',
    description: 'Create and manage expo events',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    value: 'exhibitor',
    label: 'Exhibitor',
    description: 'Showcase your company at expos',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    value: 'attendee',
    label: 'Attendee',
    description: 'Discover and attend expos',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

export default function RoleSelector({ value, onChange }) {
  return (
    <div className={styles.grid}>
      {roles.map((role) => (
        <button
          key={role.value}
          type="button"
          className={clsx(styles.card, value === role.value && styles.selected)}
          onClick={() => onChange(role.value)}
        >
          <span className={clsx(styles.icon, value === role.value && styles.iconSelected)}>
            {role.icon}
          </span>
          <span className={styles.label}>{role.label}</span>
          <span className={styles.desc}>{role.description}</span>
        </button>
      ))}
    </div>
  )
}
