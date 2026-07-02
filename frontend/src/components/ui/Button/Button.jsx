import clsx from 'clsx'
import Spinner from '../Spinner/Spinner'
import styles from './Button.module.css'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
  as: Tag = 'button',
  ...rest
}) {
  return (
    <Tag
      type={Tag === 'button' ? type : undefined}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        styles.btn,
        styles[variant],
        styles[size],
        loading && styles.loading,
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" className={styles.spinner} />}
      <span className={clsx(loading && styles.hiddenText)}>{children}</span>
    </Tag>
  )
}
