import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { createExpo } from '../../api/expo.api'
import Input from '../../components/ui/Input/Input'
import Button from '../../components/ui/Button/Button'
import styles from './CreateExpoPage.module.css'

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  theme: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  capacity: z.coerce.number().min(0).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  banner: z.any().optional(),
}).refine(d => new Date(d.endDate) > new Date(d.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export default function CreateExpoPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({ resolver: zodResolver(schema) })
  const [bannerPreview, setBannerPreview] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const mutation = useMutation({
    mutationFn: (fd) => createExpo(fd),
    onSuccess: (res) => {
      toast.success('Expo created!')
      qc.invalidateQueries(['expos'])
      navigate(`/organizer/expos/${res.data.data.expo._id}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create expo'),
  })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const removeBanner = () => {
    setBannerFile(null)
    setBannerPreview(null)
  }

  const onSubmit = (data) => {
    const fd = new FormData()
    fd.append('name', data.name)
    fd.append('description', data.description)
    if (data.theme) fd.append('theme', data.theme)
    if (data.category) fd.append('category', data.category)
    fd.append('startDate', data.startDate)
    fd.append('endDate', data.endDate)
    if (data.capacity) fd.append('capacity', data.capacity)
    fd.append('location', JSON.stringify({ address: data.address || '', city: data.city || '', country: data.country || '' }))
    if (bannerFile) fd.append('banner', bannerFile)
    mutation.mutate(fd)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create New Expo</h1>
        <p className={styles.sub}>Fill in the details to create your event</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} encType="multipart/form-data">
        {/* Left Column */}
        <div className={styles.column}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            <div className={styles.grid2}>
              <Input label="Expo Name *" placeholder="Tech Innovation Expo 2025" error={errors.name?.message} {...register('name')} />
              <Input label="Category" placeholder="Technology, Business..." error={errors.category?.message} {...register('category')} />
            </div>
            <Input label="Theme" placeholder="e.g. Future of AI" error={errors.theme?.message} {...register('theme')} />
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Description *</label>
              <textarea className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`} placeholder="Describe your expo..." rows={4} {...register('description')} />
              {errors.description && <p className={styles.error}>{errors.description.message}</p>}
            </div>
          </div>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Location</h2>
            <div className={styles.grid3}>
              <Input label="Address" placeholder="123 Main St" {...register('address')} />
              <Input label="City" placeholder="New York" {...register('city')} />
              <Input label="Country" placeholder="USA" {...register('country')} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.column}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Dates & Capacity</h2>
            <div className={styles.grid2}>
              <Input label="Start Date *" type="datetime-local" error={errors.startDate?.message} {...register('startDate')} />
              <Input label="End Date *" type="datetime-local" error={errors.endDate?.message} {...register('endDate')} />
            </div>
            <Input label="Capacity (0 = unlimited)" type="number" placeholder="500" error={errors.capacity?.message} {...register('capacity')} />
          </div>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Banner Image</h2>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Upload Banner (optional)</label>
              {bannerPreview ? (
                <div className={styles.bannerPreview}>
                  <img src={bannerPreview} alt="Banner preview" />
                  <button type="button" className={styles.removeBanner} onClick={removeBanner}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    id="banner-upload"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                  />
                  <label htmlFor="banner-upload" className={styles.uploadLabel}>
                    <div className={styles.uploadIcon}>
                      <Upload size={32} />
                    </div>
                    <div className={styles.uploadText}>
                      <p className={styles.uploadTextPrimary}>Drop your image here or click to browse</p>
                      <p className={styles.uploadTextSecondary}>PNG, JPG, GIF up to 5MB • 1200×400 recommended</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="secondary" type="button" onClick={() => navigate('/organizer/expos')}>Cancel</Button>
          <Button variant="primary" type="submit" loading={mutation.isPending}>Create Expo</Button>
        </div>
      </form>
    </div>
  )
}
