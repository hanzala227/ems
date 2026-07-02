import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Upload, User, Mail, Phone, Globe, Camera } from 'lucide-react'
import Spinner from '../../components/ui/Spinner/Spinner'
import Input from '../../components/ui/Input/Input'
import Button from '../../components/ui/Button/Button'
import * as userApi from '../../api/user.api'
import { setUser } from '../../app/slices/authSlice'
import styles from './AttProfilePage.module.css'

export default function AttProfilePage() {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const currentUser = useSelector(s => s.auth.user)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile().then(r => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm()

  useEffect(() => {
    if (data?.user) {
      reset({
        name:    data.user.name || '',
        phone:   data.user.phone || '',
        website: data.user.website || '',
        bio:     data.user.bio || '',
      })
      setAvatarPreview(data.user.avatar)
    }
  }, [data, reset])

  const profileMutation = useMutation({
    mutationFn: (d) => userApi.updateProfile(d),
    onSuccess: (res) => {
      toast.success('Profile updated')
      qc.invalidateQueries(['profile'])
      if (res.data.data?.user) dispatch(setUser(res.data.data.user))
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await userApi.updateAvatar(fd)
      setAvatarPreview(URL.createObjectURL(file))
      toast.success('Avatar updated')
      qc.invalidateQueries(['profile'])
    } catch {
      toast.error('Avatar upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  if (isLoading) return (
    <div className={styles.loadingCenter}><Spinner size="lg" /></div>
  )

  const user = data?.user

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.sub}>Manage your personal information</p>
        </div>
      </motion.div>

      <div className={styles.layout}>
        {/* Avatar card */}
        <motion.div
          className={styles.avatarCard}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatar}>
                {avatarPreview
                  ? <img src={avatarPreview} alt={user?.name} />
                  : <span>{user?.name?.[0]?.toUpperCase()}</span>
                }
              </div>
              <label className={styles.avatarOverlay} title="Change photo">
                {avatarUploading ? <Spinner size="sm" /> : <Camera size={18} />}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
              </label>
            </div>
            <div className={styles.avatarInfo}>
              <p className={styles.avatarName}>{user?.name}</p>
              <p className={styles.avatarEmail}>{user?.email}</p>
              <span className={styles.rolePill}>{user?.role}</span>
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>—</span>
              <span className={styles.statLbl}>Expos</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum}>—</span>
              <span className={styles.statLbl}>Sessions</span>
            </div>
          </div>
        </motion.div>

        {/* Profile form */}
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
        >
          <h2 className={styles.cardTitle}>Personal Information</h2>
          <form onSubmit={handleSubmit(d => profileMutation.mutate(d))} className={styles.form}>
            <div className={styles.grid2}>
              <Input
                label="Full Name"
                placeholder="Your name"
                {...register('name')}
              />
              <div className={styles.readonlyField}>
                <label className={styles.readonlyLabel}>Email</label>
                <div className={styles.readonlyValue}>
                  <Mail size={14} />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
            <Input
              label="Phone"
              placeholder="+1 234 567 8900"
              {...register('phone')}
            />
            <Input
              label="Website"
              placeholder="https://yourwebsite.com"
              {...register('website')}
            />
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Bio</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Tell us about yourself..."
                {...register('bio')}
              />
            </div>
            <div className={styles.actions}>
              <Button
                type="submit"
                variant="primary"
                loading={profileMutation.isPending}
                disabled={!isDirty}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
