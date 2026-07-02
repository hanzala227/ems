import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload, User, Lock } from 'lucide-react'
import Spinner from '../../components/ui/Spinner/Spinner'
import Input from '../../components/ui/Input/Input'
import Button from '../../components/ui/Button/Button'
import * as userApi from '../../api/user.api'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile().then(r => r.data.data),
  })

  const { register: regProfile, handleSubmit: handleProfile, reset: resetProfile, formState: { isDirty: profileDirty } } = useForm()
  const { register: regPass, handleSubmit: handlePass, reset: resetPass, formState: { errors: passErrors } } = useForm()

  useEffect(() => {
    if (data?.user) {
      resetProfile({
        name:     data.user.name     || '',
        company:  data.user.company  || '',
        bio:      data.user.bio      || '',
        phone:    data.user.phone    || '',
        website:  data.user.website  || '',
        industry: data.user.industry || '',
      })
      setAvatarPreview(data.user.avatar)
    }
  }, [data, resetProfile])

  const profileMutation = useMutation({
    mutationFn: (d) => userApi.updateProfile(d),
    onSuccess: () => { toast.success('Profile saved'); qc.invalidateQueries(['profile']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const passwordMutation = useMutation({
    mutationFn: (d) => userApi.changePassword(d),
    onSuccess: () => { toast.success('Password changed'); resetPass() },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  })

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData(); fd.append('avatar', file)
      await userApi.updateAvatar(fd)
      setAvatarPreview(URL.createObjectURL(file))
      toast.success('Avatar updated')
      qc.invalidateQueries(['profile'])
    } catch { toast.error('Avatar upload failed') }
    finally { setAvatarUploading(false) }
  }

  const user = data?.user
  if (isLoading) return <div className="page-spinner"><Spinner size="lg" /></div>

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      {/* Tab strip */}
      <div className={styles.tabs}>
        {[
          { id: 'profile',  label: 'Profile',  icon: User },
          { id: 'security', label: 'Security', icon: Lock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className={styles.layout}>
          {/* Left sidebar — avatar + quick info */}
          <div className={styles.sideInfo}>
            <div className={styles.sideCard}>
              <div className={styles.avatar}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="" />
                  : <span>{user?.name?.[0]?.toUpperCase()}</span>
                }
              </div>
              <span className={styles.sideUserName}>{user?.name}</span>
              <span className={styles.sideUserRole}>{user?.role}</span>
              <label className={styles.uploadBtn}>
                {avatarUploading
                  ? <Spinner size="sm" />
                  : <><Upload size={14} /> Change Photo</>
                }
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
              <p className={styles.hint}>JPG, PNG — max 5MB</p>
            </div>
          </div>

          {/* Right — form */}
          <div className={styles.section}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Personal Information</h2>
              <form onSubmit={handleProfile(d => profileMutation.mutate(d))} className={styles.form}>
                <div className={styles.grid2}>
                  <Input label="Full Name" {...regProfile('name')} />
                  <Input label="Company" placeholder="Your company..." {...regProfile('company')} />
                </div>
                <div className={styles.grid2}>
                  <Input label="Phone" placeholder="+1 234 567 8900" {...regProfile('phone')} />
                  <Input label="Website" placeholder="https://..." {...regProfile('website')} />
                </div>
                <Input label="Industry" placeholder="Technology, Retail..." {...regProfile('industry')} />
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Bio</label>
                  <textarea className={styles.textarea} rows={4} placeholder="Tell us about yourself..." {...regProfile('bio')} />
                </div>
                <div className={styles.actions}>
                  <Button type="submit" variant="primary" loading={profileMutation.isPending} disabled={!profileDirty}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <div className={styles.layout}>
          <div className={styles.sideInfo}>
            <div className={styles.sideCard}>
              <div className={styles.avatar} style={{ background: 'rgba(239,68,68,0.1)', border: '3px solid rgba(239,68,68,0.25)' }}>
                <Lock size={28} style={{ color: '#ef4444' }} />
              </div>
              <span className={styles.sideUserName}>Security</span>
              <span className={styles.hint}>Keep your account safe with a strong password.</span>
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Change Password</h2>
              <form onSubmit={handlePass(d => passwordMutation.mutate(d))} className={styles.form}>
                <Input
                  label="Current Password" type="password"
                  error={passErrors.currentPassword?.message}
                  {...regPass('currentPassword', { required: 'Required' })}
                />
                <Input
                  label="New Password" type="password"
                  error={passErrors.newPassword?.message}
                  {...regPass('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
                />
                <div className={styles.actions}>
                  <Button type="submit" variant="primary" loading={passwordMutation.isPending}>
                    Change Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
