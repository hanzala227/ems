import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  MousePointer2, Move, Plus, Trash2, Copy, Undo2, Redo2,
  ZoomIn, ZoomOut, Grid3X3, Maximize2, Minimize2, Save,
  Lock, Unlock, Info, ChevronDown, ChevronUp,
} from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import useFloorPlan, { STATUS_COLORS, CELL_SIZE } from '../../hooks/useFloorPlan'
import useAuth from '../../hooks/useAuth'
import * as hallApi from '../../api/hall.api'
import * as boothApi from '../../api/booth.api'
import * as floorplanApi from '../../api/floorplan.api'
import Badge from '../../components/ui/Badge/Badge'
import Modal from '../../components/ui/Modal/Modal'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import styles from './FloorPlanEditorPage.module.css'

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)', shortcut: 'v' },
  { id: 'move',   icon: Move,          label: 'Pan (H)',    shortcut: 'h' },
]

const STATUSES = ['available', 'reserved', 'occupied', 'pending', 'blocked']

export default function FloorPlanEditorPage() {
  const { id: expoId } = useParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const isOrganizer = user?.role === 'organizer'

  const fp = useFloorPlan(expoId, isOrganizer ? 'edit' : 'view')
  const {
    halls, activeHallId, booths, zoom, panX, panY, tool, showGrid,
    isFullscreen, loading, canUndo, canRedo,
    selectedBooth, selectedBooths,
    setActiveHall, setZoom, setPan, setTool, toggleGrid, toggleFullscreen,
    undo, redo, selectBooth, toggleSelect, clearSelection,
    updateBoothLocal, commitBoothUpdate, deleteBoothLocal, addBoothLocal,
    isPositionOccupied,
  } = fp

  const canvasRef  = useRef(null)
  const wrapperRef = useRef(null)
  const dragRef    = useRef(null)
  const panRef     = useRef(null)

  const [showAddHall,    setShowAddHall]    = useState(false)
  const [showInspector,  setShowInspector]  = useState(true)
  const [hallForm,       setHallForm]       = useState({ name: 'Hall A', rows: 6, columns: 10, floorNumber: 1 })
  const [editBoothForm,  setEditBoothForm]  = useState(null)
  const [showEditBooth,  setShowEditBooth]  = useState(false)
  const [dragPreview,    setDragPreview]    = useState(null)  // {row, col, valid}

  const activeHall = halls.find(h => h._id === activeHallId)
  const rows = activeHall?.rows || 0
  const cols = activeHall?.columns || 0
  const boothList = Object.values(booths)
  const boothMap  = {}
  boothList.forEach(b => { boothMap[`${b.row}-${b.col}`] = b })

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo() }
      if (e.key === 'v') setTool('select')
      if (e.key === 'h') setTool('move')
      if (e.key === 'Escape') clearSelection()
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBooth && isOrganizer) {
        handleDeleteBooth(selectedBooth._id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, setTool, clearSelection, selectedBooth, isOrganizer])

  // ── Zoom on mouse wheel ─────────────────────────────────────
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoom, setZoom])

  // ── Pan with middle mouse or space+drag ─────────────────────
  const handleCanvasMouseDown = useCallback((e) => {
    if (tool === 'move' || e.button === 1) {
      e.preventDefault()
      panRef.current = { startX: e.clientX - panX, startY: e.clientY - panY }
      const onMove = (ev) => {
        if (!panRef.current) return
        setPan(ev.clientX - panRef.current.startX, ev.clientY - panRef.current.startY)
      }
      const onUp = () => { panRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
  }, [tool, panX, panY, setPan])

  // ── Drag booth ──────────────────────────────────────────────
  const startDrag = useCallback((e, booth) => {
    if (!isOrganizer || tool !== 'select') return
    e.stopPropagation()
    selectBooth(booth._id)
    const startClientX = e.clientX
    const startClientY = e.clientY
    let dragging = false

    const onMove = (ev) => {
      const dx = (ev.clientX - startClientX) / zoom
      const dy = (ev.clientY - startClientY) / zoom
      if (!dragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) dragging = true
      if (!dragging) return
      const newRow = booth.row + Math.round(dy / CELL_SIZE)
      const newCol = booth.col + Math.round(dx / CELL_SIZE)
      const valid = newRow >= 1 && newRow <= rows && newCol >= 1 && newCol <= cols
        && !isPositionOccupied(newRow, newCol, booth._id)
      setDragPreview({ row: newRow, col: newCol, valid, boothId: booth._id })
      dragRef.current = { newRow, newCol, valid }
    }

    const onUp = async () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!dragging || !dragRef.current?.valid) { setDragPreview(null); return }
      const { newRow, newCol } = dragRef.current
      setDragPreview(null)
      dragRef.current = null
      const updated = { ...booth, row: newRow, col: newCol }
      commitBoothUpdate(updated)
      try {
        await boothApi.updateBoothPosition(booth._id, { positionX: newCol, positionY: newRow })
      } catch { toast.error('Failed to save position'); commitBoothUpdate(booth) }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [isOrganizer, tool, zoom, rows, cols, isPositionOccupied, selectBooth, commitBoothUpdate])

  // ── Mutations ───────────────────────────────────────────────
  const addHallMutation = useMutation({
    mutationFn: () => hallApi.createHall({ ...hallForm, expoId }),
    onSuccess: (res) => {
      toast.success(`Hall "${hallForm.name}" created with ${hallForm.rows * hallForm.columns} booths`)
      qc.invalidateQueries(['halls', expoId])
      // Refetch halls by re-triggering the hook — set the new hall as active after a brief delay
      const newHallId = res.data.data?.hall?._id
      setTimeout(() => { if (newHallId) setActiveHall(newHallId) }, 300)
      setShowAddHall(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create hall'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => boothApi.changeBoothStatus(id, status),
    onSuccess: (_, vars) => {
      commitBoothUpdate({ ...booths[vars.id], status: vars.status })
      toast.success(`Status → ${vars.status}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const handleDeleteBooth = useCallback(async (boothId) => {
    if (!boothId) return
    const booth = booths[boothId]
    if (!booth) return
    deleteBoothLocal(boothId)
    clearSelection()
    try {
      await boothApi.changeBoothStatus(boothId, 'blocked')
      toast.success(`Booth ${booth.boothNumber} blocked`)
    } catch { addBoothLocal(booth); toast.error('Failed') }
  }, [booths, deleteBoothLocal, addBoothLocal, clearSelection])

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedBooth) return
    const row = selectedBooth.row
    const col = selectedBooth.col
    
    // Find first available adjacent cell
    const adjacentCells = [
      { r: row, c: col + selectedBooth.width }, // right
      { r: row + selectedBooth.height, c: col }, // bottom
      { r: row, c: col - 1 }, // left
      { r: row - 1, c: col }, // top
    ]
    
    let targetRow = null
    let targetCol = null
    
    for (const pos of adjacentCells) {
      if (pos.r >= 1 && pos.r <= rows && pos.c >= 1 && pos.c <= cols && !isPositionOccupied(pos.r, pos.c)) {
        targetRow = pos.r
        targetCol = pos.c
        break
      }
    }
    
    if (targetRow === null || targetCol === null) {
      toast.error('No adjacent space available to duplicate booth')
      return
    }
    
    const newBooth = {
      ...selectedBooth,
      _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      boothNumber: `${selectedBooth.boothNumber}-Copy`,
      row: targetRow,
      col: targetCol,
      status: 'available',
      exhibitorId: null,
      applicationId: null
    }
    
    addBoothLocal(newBooth)
    toast.success('Booth duplicated locally. Save layout to persist.', { duration: 3000 })
  }, [selectedBooth, rows, cols, isPositionOccupied, addBoothLocal])

  const handleEditBoothSave = useCallback(async () => {
    if (!editBoothForm || !selectedBooth) return
    const updated = { ...selectedBooth, ...editBoothForm }
    commitBoothUpdate(updated)
    setShowEditBooth(false)
    try {
      await boothApi.changeBoothStatus(selectedBooth._id, editBoothForm.status)
      toast.success('Booth updated')
    } catch { toast.error('Failed to update') }
  }, [editBoothForm, selectedBooth, commitBoothUpdate])

  const handleSaveSettings = async () => {
    if (!activeHallId || !expoId) return
    try {
      await floorplanApi.saveFloorPlan(activeHallId, { expoId, zoom, panX, panY, showGrid })
      toast.success('Layout saved successfully')
    } catch {
      toast.error('Failed to save layout')
    }
  }

  const openEditBooth = useCallback(() => {
    if (!selectedBooth) return
    setEditBoothForm({
      status: selectedBooth.status,
      price: selectedBooth.price || 0,
      notes: selectedBooth.notes || '',
    })
    setShowEditBooth(true)
  }, [selectedBooth])

  return (
    <div className={`${styles.workspace} ${isFullscreen ? styles.fullscreen : ''}`}>
      {/* ── Top toolbar ──────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {/* Hall tabs */}
          <div className={styles.hallTabs}>
            {halls.map(h => (
              <button key={h._id} className={`${styles.hallTab} ${activeHallId === h._id ? styles.activeHall : ''}`}
                onClick={() => setActiveHall(h._id)}>
                {h.name}
                <span className={styles.hallDim}>{h.rows}×{h.columns}</span>
              </button>
            ))}
            {isOrganizer && (
              <button className={styles.addHallBtn} onClick={() => setShowAddHall(true)} title="Add Hall">
                <Plus size={13}/> Hall
              </button>
            )}
          </div>
        </div>

        <div className={styles.toolbarCenter}>
          {/* Tool buttons */}
          {isOrganizer && TOOLS.map(t => (
            <button key={t.id} className={`${styles.toolBtn} ${tool === t.id ? styles.activeTool : ''}`}
              onClick={() => setTool(t.id)} title={t.label}>
              <t.icon size={16}/>
            </button>
          ))}
          <div className={styles.toolDivider}/>

          {/* Undo/Redo */}
          {isOrganizer && (
            <>
              <button className={styles.toolBtn} onClick={undo} disabled={!canUndo} title="Undo (⌘Z)"><Undo2 size={15}/></button>
              <button className={styles.toolBtn} onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)"><Redo2 size={15}/></button>
              <div className={styles.toolDivider}/>
              <button className={styles.toolBtn} onClick={handleDuplicateSelected} disabled={!selectedBooth} title="Duplicate"><Copy size={15}/></button>
              <button className={`${styles.toolBtn} ${styles.dangerTool}`} onClick={() => selectedBooth && handleDeleteBooth(selectedBooth._id)} disabled={!selectedBooth} title="Delete/Block (Del)"><Trash2 size={15}/></button>
              <div className={styles.toolDivider}/>
            </>
          )}

          {/* Zoom */}
          <button className={styles.toolBtn} onClick={() => setZoom(zoom - 0.12)} title="Zoom out"><ZoomOut size={15}/></button>
          <span className={styles.zoomDisplay}>{Math.round(zoom * 100)}%</span>
          <button className={styles.toolBtn} onClick={() => setZoom(zoom + 0.12)} title="Zoom in"><ZoomIn size={15}/></button>
          <button className={styles.toolBtn} onClick={() => setZoom(1)} title="Reset zoom" style={{ fontSize: 10, fontWeight: 700, width: 32 }}>1:1</button>
          <div className={styles.toolDivider}/>

          {/* Grid + Fullscreen */}
          <button className={`${styles.toolBtn} ${showGrid ? styles.activeTool : ''}`} onClick={toggleGrid} title="Toggle grid"><Grid3X3 size={15}/></button>
          <button className={styles.toolBtn} onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}
          </button>
        </div>

        <div className={styles.toolbarRight}>
          {isOrganizer && (
            <button className={styles.toolBtn} style={{ padding: '0 12px', width: 'auto', background: 'rgba(124,92,191,0.15)', color: '#9b74d4', border: '1px solid rgba(124,92,191,0.3)' }} onClick={handleSaveSettings}>
              <Save size={14} style={{ marginRight: 6 }}/> Save Layout
            </button>
          )}
          {selectedBooth && isOrganizer && (
            <button className={styles.editBoothBtn} onClick={openEditBooth}>
              <Info size={13}/> Edit Booth
            </button>
          )}
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className={styles.mainArea}>
        {/* Canvas */}
        <div
          ref={wrapperRef}
          className={`${styles.canvasWrapper} ${tool === 'move' ? styles.cursorGrab : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onClick={(e) => { if (e.target === wrapperRef.current || e.target === canvasRef.current) clearSelection() }}
        >
          {loading ? (
            <Skeleton height={400} />
          ) : !halls.length ? (
            <div className={styles.emptyCanvas}>
              <div className={styles.emptyIcon}>⬜</div>
              <h3>No halls yet</h3>
              <p>Create your first hall to start building the floor plan</p>
              {isOrganizer && (
                <button className={styles.emptyAddBtn} onClick={() => setShowAddHall(true)}>
                  <Plus size={14}/> Create Hall
                </button>
              )}
            </div>
          ) : (
            <div
              ref={canvasRef}
              className={styles.canvas}
              style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' }}
            >
              {/* Grid background */}
              {showGrid && (
                <div className={styles.gridBg} style={{
                  width:  cols * CELL_SIZE + 1,
                  height: rows * CELL_SIZE + 1,
                  backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
                }}/>
              )}

              {/* Booths */}
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const row  = r + 1
                  const col  = c + 1
                  const booth = boothMap[`${row}-${col}`]
                  const isDragTarget = dragPreview?.row === row && dragPreview?.col === col && dragPreview?.boothId !== booth?._id
                  const isDragging   = dragPreview && booth && dragPreview.boothId === booth._id
                  const isSelected   = booth && fp.selectedIds.has(booth._id)
                  const st   = booth?.status || 'available'
                  const clr  = STATUS_COLORS[st]

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`${styles.cell} ${isSelected ? styles.cellSelected : ''} ${isDragging ? styles.cellDragging : ''} ${isDragTarget ? (dragPreview.valid ? styles.cellDropValid : styles.cellDropInvalid) : ''}`}
                      style={{
                        left:   (col - 1) * CELL_SIZE,
                        top:    (row - 1) * CELL_SIZE,
                        width:  CELL_SIZE - 3,
                        height: CELL_SIZE - 3,
                        background: isDragTarget ? (dragPreview.valid ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : clr.bg,
                        border: `1.5px solid ${isSelected ? '#fff' : isDragTarget ? (dragPreview.valid ? '#22c55e' : '#ef4444') : clr.border}`,
                        boxShadow: isSelected ? `0 0 0 2px ${clr.border}, 0 4px 16px rgba(0,0,0,0.3)` : isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
                        opacity: isDragging ? 0.4 : 1,
                        cursor: isOrganizer && tool === 'select' ? (booth ? 'grab' : 'default') : 'default',
                        transition: isDragging ? 'none' : 'all 0.12s ease',
                        zIndex: isSelected ? 10 : 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!booth) return
                        if (e.shiftKey) toggleSelect(booth._id)
                        else selectBooth(booth._id)
                      }}
                      onMouseDown={(e) => booth && isOrganizer && tool === 'select' && startDrag(e, booth)}
                    >
                      {booth && !isDragging && (
                        <div className={styles.cellContent}>
                          <span className={styles.cellNum} style={{ color: isSelected ? '#fff' : clr.color }}>
                            {booth.boothNumber}
                          </span>
                          {booth.exhibitorId && (
                            <span className={styles.cellTenant}>
                              {booth.exhibitorId.company || booth.exhibitorId.name}
                            </span>
                          )}
                          {booth.width > 1 && <span className={styles.cellSize}>{booth.width}×{booth.height}</span>}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* ── Inspector panel ──────────────────────────────── */}
        {isOrganizer && (
          <div className={`${styles.inspector} ${showInspector ? '' : styles.inspectorCollapsed}`}>
            <button className={styles.inspectorToggle} onClick={() => setShowInspector(v => !v)}>
              {showInspector ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              <span>Inspector</span>
            </button>

            {showInspector && (
              <div className={styles.inspectorBody}>
                {!selectedBooth ? (
                  <div className={styles.inspectorEmpty}>
                    <MousePointer2 size={28}/>
                    <p>Select a booth to inspect</p>
                    <p className={styles.inspectorHint}>Shift+click for multi-select</p>
                  </div>
                ) : (
                  <div className={styles.inspectorContent}>
                    <div className={styles.inspectorSection}>
                      <span className={styles.inspectorLabel}>Booth</span>
                      <span className={styles.inspectorValue}>{selectedBooth.boothNumber}</span>
                    </div>
                    <div className={styles.inspectorSection}>
                      <span className={styles.inspectorLabel}>Status</span>
                      <select className={styles.statusSelect} value={selectedBooth.status}
                        onChange={e => statusMutation.mutate({ id: selectedBooth._id, status: e.target.value })}>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
                      </select>
                    </div>
                    <div className={styles.inspectorSection}>
                      <span className={styles.inspectorLabel}>Size</span>
                      <span className={styles.inspectorValue}>{selectedBooth.width}×{selectedBooth.height} units</span>
                    </div>
                    <div className={styles.inspectorSection}>
                      <span className={styles.inspectorLabel}>Position</span>
                      <span className={styles.inspectorValue}>Row {selectedBooth.row}, Col {selectedBooth.col}</span>
                    </div>
                    <div className={styles.inspectorSection}>
                      <span className={styles.inspectorLabel}>Price</span>
                      <span className={styles.inspectorValue}>${selectedBooth.price || 0}</span>
                    </div>
                    {selectedBooth.exhibitorId && (
                      <div className={styles.inspectorSection}>
                        <span className={styles.inspectorLabel}>Exhibitor</span>
                        <span className={styles.inspectorValue}>{selectedBooth.exhibitorId.company || selectedBooth.exhibitorId.name}</span>
                      </div>
                    )}
                    <button className={styles.inspectorEditBtn} onClick={openEditBooth}>
                      Edit Details
                    </button>
                    <button className={`${styles.inspectorEditBtn} ${styles.inspectorBlockBtn}`}
                      onClick={() => handleDeleteBooth(selectedBooth._id)}>
                      {selectedBooth.status === 'blocked' ? <><Unlock size={12}/> Unblock</> : <><Lock size={12}/> Block</>}
                    </button>
                  </div>
                )}

                {/* Legend */}
                <div className={styles.legend}>
                  {STATUSES.map(st => (
                    <div key={st} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: STATUS_COLORS[st].color }}/>
                      <span>{STATUS_COLORS[st].label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Status bar ───────────────────────────────────────── */}
      <div className={styles.statusBar}>
        <span>{boothList.length} booths · {halls.length} hall{halls.length !== 1 ? 's' : ''}</span>
        {selectedBooths.length > 1 && <span>{selectedBooths.length} selected</span>}
        <span className={styles.statusBarRight}>
          {activeHall && `${activeHall.name} · ${rows}×${cols}`}
        </span>
      </div>

      {/* ── Edit Booth Modal ─────────────────────────────────── */}
      <Modal isOpen={showEditBooth} onClose={() => setShowEditBooth(false)} title={`Edit Booth ${selectedBooth?.boothNumber}`}
        footer={<><Button variant="secondary" onClick={() => setShowEditBooth(false)}>Cancel</Button><Button variant="primary" onClick={handleEditBoothSave}>Save</Button></>}>
        {editBoothForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</label>
              <select className={styles.statusSelect} value={editBoothForm.status} onChange={e => setEditBoothForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
              </select>
            </div>
            <Input label="Price ($)" type="number" value={editBoothForm.price} onChange={e => setEditBoothForm(f => ({ ...f, price: Number(e.target.value) }))} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</label>
              <textarea style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text-primary)', fontSize: '0.875rem', padding: '10px 14px', fontFamily: 'var(--font-sans)', resize: 'vertical' }}
                rows={3} value={editBoothForm.notes} onChange={e => setEditBoothForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add Hall Modal ───────────────────────────────────── */}
      <Modal isOpen={showAddHall} onClose={() => setShowAddHall(false)} title="Create New Hall"
        footer={<><Button variant="secondary" onClick={() => setShowAddHall(false)}>Cancel</Button><Button variant="primary" loading={addHallMutation.isPending} onClick={() => addHallMutation.mutate()}>Create Hall</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Hall Name *" value={hallForm.name} onChange={e => setHallForm(f => ({...f, name: e.target.value}))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Rows *" type="number" min="1" max="30" value={hallForm.rows} onChange={e => setHallForm(f => ({...f, rows: Number(e.target.value)}))} />
            <Input label="Columns *" type="number" min="1" max="30" value={hallForm.columns} onChange={e => setHallForm(f => ({...f, columns: Number(e.target.value)}))} />
          </div>
          <Input label="Floor Number" type="number" value={hallForm.floorNumber} onChange={e => setHallForm(f => ({...f, floorNumber: Number(e.target.value)}))} />
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
            Will auto-generate <strong style={{ color: 'var(--color-text-primary)' }}>{hallForm.rows * hallForm.columns} booths</strong> in a {hallForm.rows}×{hallForm.columns} grid.
          </div>
        </div>
      </Modal>
    </div>
  )
}
