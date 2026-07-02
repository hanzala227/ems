import clsx from 'clsx'
import styles from './Input.module.css'

export default function Input({
  label,
  error,
  id,
  type = 'text',
  icon: Icon,
  className,
  ...rest
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={clsx(styles.group, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.wrapper}>
        {Icon && (
          <span className={styles.iconLeft}>
            <Icon size={16} />
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={clsx(styles.input, Icon && styles.withIcon, error && styles.inputError)}
          {...rest}
        />
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}
