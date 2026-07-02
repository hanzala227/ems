import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { forgotPassword } from '../../api/auth.api'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import styles from './AuthPage.module.css'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
})

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState(null)
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await forgotPassword(data.email)
      const token = res.data?.resetToken
      if (token) {
        setResetToken(token)
        toast.success('Reset token generated!')
      } else {
        toast.success('If that email exists, a reset token has been generated.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`/reset-password/${resetToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (resetToken) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Reset Token Generated</h1>
          <p className={styles.subtitle}>Development mode — token returned directly</p>
        </div>
        <div className={styles.tokenBox}>
          <p className={styles.tokenLabel}>Use this URL to reset your password:</p>
          <code className={styles.tokenCode}>/reset-password/{resetToken}</code>
          <Button variant="secondary" size="sm" onClick={handleCopy} className={styles.copyBtn}>
            {copied ? '✓ Copied!' : 'Copy URL'}
          </Button>
        </div>
        <div className={styles.tokenActions}>
          <Link to={`/reset-password/${resetToken}`} className={styles.link}>
            Go to Reset Password →
          </Link>
        </div>
        <p className={styles.footer}>
          <Link to="/login" className={styles.link}>← Back to Login</Link>
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Forgot password?</h1>
        <p className={styles.subtitle}>Enter your email to receive a reset token</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
          Generate Reset Token
        </Button>
      </form>

      <p className={styles.footer}>
        <Link to="/login" className={styles.link}>← Back to Login</Link>
      </p>
    </motion.div>
  )
}
