import clsx from 'clsx'
import styles from './Badge.module.css'

export default function Badge({ children, variant = 'draft', className }) {
  return (
    <span className={clsx(styles.badge, styles[variant], className)}>
      {children}
    </span>
  )
}
