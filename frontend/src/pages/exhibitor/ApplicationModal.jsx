import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { submitApplication } from '../../api/application.api'
import Modal from '../../components/ui/Modal/Modal'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import styles from './ApplicationModal.module.css'

export default function ApplicationModal({ expo, onClose }) {
  const qc = useQueryClient()
  const user = useSelector(s => s.auth.user)
  const [form, setForm] = useState({
    companyDescription: user?.bio || '',
    category: user?.industry || '',
    boothPreference: '',
    specialRequirements: '',
  })

  const mutation = useMutation({
    mutationFn: () => submitApplication({ expoId: expo._id, ...form }),
    onSuccess: () => {
      toast.success('Application submitted!')
      qc.invalidateQueries(['applications', 'my'])
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit'),
  })

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Apply to "${expo.name}"`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Submit Application
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.expoInfo}>
          <p className={styles.expoName}>{expo.name}</p>
          <p className={styles.expoMeta}>{expo.location?.city && `${expo.location.city}, ${expo.location.country}`}</p>
        </div>

        <Input
          label="Category *"
          placeholder="e.g. Technology, Retail..."
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        />
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Company Description *</label>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Describe your company and what you'll showcase..."
            value={form.companyDescription}
            onChange={e => setForm(f => ({ ...f, companyDescription: e.target.value }))}
          />
        </div>
        <Input
          label="Booth Preference (optional)"
          placeholder="e.g. Hall A - A15, corner booth..."
          value={form.boothPreference}
          onChange={e => setForm(f => ({ ...f, boothPreference: e.target.value }))}
        />
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Special Requirements (optional)</label>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Any special equipment, power requirements, setup needs..."
            value={form.specialRequirements}
            onChange={e => setForm(f => ({ ...f, specialRequirements: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}
