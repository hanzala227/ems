import clsx from 'clsx'
import styles from './Spinner.module.css'

export default function Spinner({ size = 'md', className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(styles.spinner, styles[size], className)}
    />
  )
}
