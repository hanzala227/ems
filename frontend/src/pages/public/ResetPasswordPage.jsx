import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { resetPassword } from '../../api/auth.api'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import styles from './AuthPage.module.css'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await resetPassword(token, data.password)
      toast.success('Password reset successfully!')
      navigate('/login', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired token. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>Enter a new password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label="New Password"
          type="password"
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
          Reset Password
        </Button>
      </form>

      <p className={styles.footer}>
        <Link to="/login" className={styles.link}>← Back to Login</Link>
      </p>
    </motion.div>
  )
}
