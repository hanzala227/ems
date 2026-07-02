import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload, Trash2, FileText } from 'lucide-react'
import * as userApi from '../../api/user.api'
import Input from '../../components/ui/Input/Input'
import Button from '../../components/ui/Button/Button'
import Spinner from '../../components/ui/Spinner/Spinner'
import styles from './ExhProfilePage.module.css'

export default function ExhProfilePage() {
  const qc = useQueryClient()
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile().then(r => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm()

  useEffect(() => {
    if (data?.user) {
      reset({
        name: data.user.name || '',
        company: data.user.company || '',
        bio: data.user.bio || '',
        phone: data.user.phone || '',
        website: data.user.website || '',
        industry: data.user.industry || '',
      })
      setAvatarPreview(data.user.avatar || null)
    }
  }, [data, reset])

  const updateMutation = useMutation({
    mutationFn: (formData) => userApi.updateProfile(formData),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries(['profile']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData(); fd.append('avatar', file)
      await userApi.updateAvatar(fd)
      setAvatarPreview(URL.createObjectURL(file))
      toast.success('Avatar updated')
      qc.invalidateQueries(['profile'])
    } catch { toast.error('Failed to upload avatar') }
    finally { setUploadingAvatar(false) }
  }

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const fd = new FormData(); fd.append('document', file)
      await userApi.uploadDocument(fd)
      toast.success('Document uploaded')
      qc.invalidateQueries(['profile'])
    } catch { toast.error('Failed to upload document') }
    finally { setUploadingDoc(false) }
  }

  const deleteDoc = async (docId) => {
    try {
      await userApi.deleteDocument(docId)
      toast.success('Document removed')
      qc.invalidateQueries(['profile'])
    } catch { toast.error('Failed to remove document') }
  }

  const user = data?.user
  const docs = user?.documents || []

  if (isLoading) return <div className="page-spinner"><Spinner size="lg" /></div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Company Profile</h1>

      <div className={styles.layout}>
        {/* Left Sidebar */}
        <div className={styles.sideInfo}>
          <div className={styles.sideCard}>
            <div className={styles.avatar}>
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" />
                : <span>{user?.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <span className={styles.sideUserName}>{user?.company || user?.name}</span>
            <span className={styles.sideUserRole}>{user?.role}</span>
            <label className={styles.uploadBtn}>
              {uploadingAvatar ? <Spinner size="sm" /> : <><Upload size={14} /> Change Photo</>}
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </label>
            <p className={styles.hint}>JPG, PNG — max 5MB</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={styles.section}>
          {/* Company Information Form */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Company Information</h2>
            <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className={styles.form}>
              <div className={styles.grid2}>
                <Input label="Full Name" error={errors.name?.message} {...register('name', { required: 'Required' })} />
                <Input label="Company Name" placeholder="Your company..." {...register('company')} />
              </div>
              <div className={styles.grid2}>
                <Input label="Industry" placeholder="Technology, Retail..." {...register('industry')} />
                <Input label="Website" placeholder="https://company.com" {...register('website')} />
              </div>
              <Input label="Phone" placeholder="+1 234 567 8900" {...register('phone')} />
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Bio / Description</label>
                <textarea className={styles.textarea} rows={4} placeholder="Describe your company, products or services..." {...register('bio')} />
              </div>
              <div className={styles.formActions}>
                <Button type="submit" variant="primary" loading={updateMutation.isPending} disabled={!isDirty}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Documents Section */}
          <div className={styles.card}>
            <div className={styles.docHeader}>
              <h2 className={styles.cardTitle}>Documents</h2>
              <label className={styles.uploadBtn}>
                {uploadingDoc ? <Spinner size="sm" /> : <><Upload size={14} /> Upload Document</>}
                <input type="file" accept="image/*,application/pdf" hidden onChange={handleDocUpload} disabled={uploadingDoc} />
              </label>
            </div>
            
            {!docs.length ? (
              <div className={styles.emptyDocs}>
                <FileText size={32} />
                <p>No documents uploaded. Upload company registration, licenses, or brochures.</p>
              </div>
            ) : (
              <div className={styles.docList}>
                {docs.map((doc, i) => (
                  <div key={doc._id || i} className={styles.docItem}>
                    <FileText size={20} className={styles.docIcon} />
                    <div className={styles.docInfo}>
                      <span className={styles.docName}>{doc.name}</span>
                      <span className={styles.docType}>{doc.type}</span>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className={styles.docView}>View</a>
                    <button className={styles.docDelete} onClick={() => deleteDoc(doc._id || doc.publicId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
