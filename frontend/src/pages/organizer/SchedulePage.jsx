import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { listSessionsByExpo, createSession, updateSession, deleteSession, listStagesByExpo, createStage } from '../../api/session.api'
import Badge from '../../components/ui/Badge/Badge'
import Button from '../../components/ui/Button/Button'
import Modal from '../../components/ui/Modal/Modal'
import Input from '../../components/ui/Input/Input'
import styles from './SchedulePage.module.css'

export default function SchedulePage() {
  const { id: expoId } = useParams()
  const qc = useQueryClient()
  const [showSession, setShowSession] = useState(false)
  const [showStage, setShowStage] = useState(false)
  const [sessionForm, setSessionForm] = useState({ title:'', description:'', stageId:'', speakerName:'', startTime:'', endTime:'', capacity:0 })
  const [editSessionId, setEditSessionId] = useState(null)
  const [stageForm, setStageForm] = useState({ name:'', capacity:0, description:'' })

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions', expoId],
    queryFn: () => listSessionsByExpo(expoId).then(r => r.data.data),
  })
  const { data: stagesData } = useQuery({
    queryKey: ['stages', expoId],
    queryFn: () => listStagesByExpo(expoId).then(r => r.data.data),
  })

  const sessionMutation = useMutation({
    mutationFn: () => {
      if (editSessionId) return updateSession(editSessionId, sessionForm)
      return createSession({ ...sessionForm, expoId })
    },
    onSuccess: () => { 
      toast.success(`Session ${editSessionId ? 'updated' : 'created'}`); 
      qc.invalidateQueries(['sessions', expoId]); 
      setShowSession(false); 
      setEditSessionId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })
  const stageMutation = useMutation({
    mutationFn: () => createStage({ ...stageForm, expoId }),
    onSuccess: () => { toast.success('Stage created'); qc.invalidateQueries(['stages', expoId]); setShowStage(false) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSession(id),
    onSuccess: () => { toast.success('Session deleted'); qc.invalidateQueries(['sessions', expoId]) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const sessions = sessionsData?.sessions || []
  const stages = stagesData?.stages || []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Schedule</h1>
          <p className={styles.sub}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" onClick={() => setShowStage(true)}><Plus size={14}/> Add Stage</Button>
          <Button variant="primary" size="sm" onClick={() => { setEditSessionId(null); setSessionForm({ title:'', description:'', stageId:'', speakerName:'', startTime:'', endTime:'', capacity:0 }); setShowSession(true); }}><Plus size={14}/> Add Session</Button>
        </div>
      </div>

      {isLoading ? <Skeleton count={4} height={80} style={{ marginBottom: 8 }} /> :
       !sessions.length ? (
        <div className={styles.empty}>
          <p>No sessions yet. <button className={styles.link} onClick={() => setShowSession(true)}>Add the first one →</button></p>
        </div>
      ) : (
        <div className={styles.sessionList}>
          {sessions.map(s => (
            <div key={s._id} className={styles.sessionCard}>
              <div className={styles.sessionTime}>
                <span>{format(new Date(s.startTime), 'h:mm a')}</span>
                <span className={styles.timeSep}>–</span>
                <span>{format(new Date(s.endTime), 'h:mm a')}</span>
              </div>
              <div className={styles.sessionInfo}>
                <span className={styles.sessionTitle}>{s.title}</span>
                {s.speakerName && <span className={styles.sessionSpeaker}>{s.speakerName}</span>}
                {s.stageId && <span className={styles.sessionStage}>{s.stageId.name}</span>}
              </div>
              <Badge variant={s.status.toLowerCase()}>{s.status}</Badge>
              <div className={styles.sessionActions} style={{ display: 'flex', gap: '8px' }}>
                <button className={styles.deleteBtn} onClick={() => {
                  setEditSessionId(s._id);
                  setSessionForm({
                    title: s.title,
                    description: s.description || '',
                    stageId: s.stageId?._id || '',
                    speakerName: s.speakerName || '',
                    startTime: new Date(s.startTime).toISOString().slice(0, 16),
                    endTime: new Date(s.endTime).toISOString().slice(0, 16),
                    capacity: s.capacity || 0
                  });
                  setShowSession(true);
                }} title="Edit">
                  <Edit2 size={14}/>
                </button>
                <button className={styles.deleteBtn} onClick={() => deleteMutation.mutate(s._id)} title="Delete">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Session Modal */}
      <Modal isOpen={showSession} onClose={() => { setShowSession(false); setEditSessionId(null); }} title={editSessionId ? "Edit Session" : "Add Session"}
        footer={<><Button variant="secondary" onClick={() => { setShowSession(false); setEditSessionId(null); }}>Cancel</Button>
          <Button variant="primary" loading={sessionMutation.isPending} onClick={() => sessionMutation.mutate()}>{editSessionId ? 'Save' : 'Create'}</Button></>}>
        <div className={styles.formGrid}>
          <Input label="Title *" value={sessionForm.title} onChange={e => setSessionForm(f => ({...f, title: e.target.value}))} />
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Stage *</label>
            <select className={styles.select} value={sessionForm.stageId} onChange={e => setSessionForm(f => ({...f, stageId: e.target.value}))}>
              <option value="">Select stage</option>
              {stages.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <Input label="Speaker Name" value={sessionForm.speakerName} onChange={e => setSessionForm(f => ({...f, speakerName: e.target.value}))} />
          <Input label="Capacity (0=unlimited)" type="number" value={sessionForm.capacity} onChange={e => setSessionForm(f => ({...f, capacity: Number(e.target.value)}))} />
          <Input label="Start Time *" type="datetime-local" value={sessionForm.startTime} onChange={e => setSessionForm(f => ({...f, startTime: e.target.value}))} />
          <Input label="End Time *" type="datetime-local" value={sessionForm.endTime} onChange={e => setSessionForm(f => ({...f, endTime: e.target.value}))} />
        </div>
      </Modal>

      {/* Add Stage Modal */}
      <Modal isOpen={showStage} onClose={() => setShowStage(false)} title="Add Stage"
        footer={<><Button variant="secondary" onClick={() => setShowStage(false)}>Cancel</Button>
          <Button variant="primary" loading={stageMutation.isPending} onClick={() => stageMutation.mutate()}>Create</Button></>}>
        <div className={styles.formGrid}>
          <Input label="Stage Name *" value={stageForm.name} onChange={e => setStageForm(f => ({...f, name: e.target.value}))} />
          <Input label="Capacity" type="number" value={stageForm.capacity} onChange={e => setStageForm(f => ({...f, capacity: Number(e.target.value)}))} />
          <Input label="Description" value={stageForm.description} onChange={e => setStageForm(f => ({...f, description: e.target.value}))} />
        </div>
      </Modal>
    </div>
  )
}
