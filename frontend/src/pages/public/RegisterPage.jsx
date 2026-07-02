import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { register as registerApi } from '../../api/auth.api'
import { setUser } from '../../app/slices/authSlice'
import RoleSelector from '../../features/auth/RoleSelector'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import styles from './AuthPage.module.css'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['organizer', 'exhibitor', 'attendee'], { message: 'Please select a role' }),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const handleRoleChange = (role) => {
    setSelectedRole(role)
    setValue('role', role, { shouldValidate: true })
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await registerApi(data)
      dispatch(setUser(res.data.user))
      toast.success('Welcome to EventSphere!')
      navigate(`/${res.data.user.role}`, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
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
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Join EventSphere and start managing expos</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <div className={styles.field}>
          <label className={styles.label}>Choose your role</label>
          <RoleSelector value={selectedRole} onChange={handleRoleChange} />
          {errors.role && <p className={styles.fieldError}>{errors.role.message}</p>}
        </div>

        <Input
          label="Full Name"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register('name')}
        />

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
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
          Create Account
        </Button>
      </form>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link to="/login" className={styles.link}>Sign in</Link>
      </p>
    </motion.div>
  )
}
