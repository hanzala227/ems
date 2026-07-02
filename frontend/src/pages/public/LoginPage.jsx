import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { login as loginApi } from '../../api/auth.api'
import { setUser } from '../../app/slices/authSlice'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import styles from './AuthPage.module.css'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await loginApi(data)
      dispatch(setUser(res.data.user))
      toast.success('Welcome back!')
      navigate(`/${res.data.user.role}`, { replace: true })
    } catch (err) {
      const status = err.response?.status
      const msg = status === 401
        ? 'Invalid email or password'
        : (err.response?.data?.message || 'Login failed. Please try again.')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className={styles.heading}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your EventSphere account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className={styles.forgotRow}>
          <Link to="/forgot-password" className={styles.link}>Forgot password?</Link>
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
          Sign In
        </Button>
      </form>

      <p className={styles.footer}>
        Don&apos;t have an account?{' '}
        <Link to="/register" className={styles.link}>Create one</Link>
      </p>
    </motion.div>
  )
}
