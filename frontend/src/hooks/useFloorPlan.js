import { useEffect, useReducer, useCallback, useRef } from 'react'
import * as hallApi from '../api/hall.api'
import * as boothApi from '../api/booth.api'
import * as floorplanApi from '../api/floorplan.api'

// ── Constants ──────────────────────────────────────────────────
export const CELL_SIZE = 84   // px per grid unit
export const MIN_ZOOM  = 0.3
export const MAX_ZOOM  = 2.5
export const ZOOM_STEP = 0.12

export const STATUS_COLORS = {
  available: { bg: 'rgba(34,197,94,0.12)',   border: '#22c55e', color: '#22c55e',  label: 'Available'  },
  occupied:  { bg: 'rgba(13,148,136,0.18)',  border: '#0d9488', color: '#0d9488',  label: 'Occupied'   },
  reserved:  { bg: 'rgba(124,92,191,0.18)',  border: '#7c5cbf', color: '#9b74d4',  label: 'Reserved'   },
  pending:   { bg: 'rgba(245,158,11,0.15)',  border: '#f59e0b', color: '#f59e0b',  label: 'Pending'    },
  blocked:   { bg: 'rgba(37,40,54,0.6)',     border: '#3d4155', color: '#5a5e72',  label: 'Blocked'    },
}

// ── State ─────────────────────────────────────────────────────
const initialState = {
  halls:          [],
  activeHallId:   null,
  booths:         {},         // { [boothId]: booth }
  selectedIds:    new Set(),  // multi-select
  zoom:           1,
  panX:           0,
  panY:           0,
  tool:           'select',   // 'select' | 'move' | 'add' | 'delete'
  showGrid:       true,
  isFullscreen:   false,
  loading:        false,
  error:          null,
  // undo/redo stacks (store booth snapshots)
  undoStack:      [],
  redoStack:      [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_HALLS':
      return { ...state, halls: action.payload }

    case 'SET_ACTIVE_HALL':
      return {
        ...state,
        activeHallId: action.payload,
        booths: {},
        selectedIds: new Set(),
        undoStack: [],
        redoStack: [],
      }

    case 'SET_FLOORPLAN_SETTINGS':
      return {
        ...state,
        zoom: action.payload.zoom ?? 1,
        panX: action.payload.panX ?? 0,
        panY: action.payload.panY ?? 0,
        showGrid: action.payload.showGrid ?? true,
      }

    case 'SET_BOOTHS': {
      const map = { ...state.booths }
      // Merge updates instead of replacing to preserve dragging state
      action.payload.forEach(b => {
        // If booth is in local state but position hasn't changed locally, update it.
        // We do a simple merge. In a real app we'd track dragging items and ignore remote updates for them.
        map[b._id] = { ...map[b._id], ...b }
      })
      // Remove deleted booths
      const newKeys = new Set(action.payload.map(b => b._id))
      Object.keys(map).forEach(key => {
        if (!newKeys.has(key)) delete map[key]
      })
      return { ...state, booths: map }
    }

    case 'UPDATE_BOOTH':
      return {
        ...state,
        booths: { ...state.booths, [action.payload._id]: { ...state.booths[action.payload._id], ...action.payload } },
      }

    case 'UPDATE_BOOTH_COMMIT': {
      const snapshot = { ...state.booths }
      const newUndoStack = [...state.undoStack, snapshot].slice(-20)
      return {
        ...state,
        undoStack: newUndoStack,
        redoStack: [],
        booths: { ...state.booths, [action.payload._id]: { ...state.booths[action.payload._id], ...action.payload } },
      }
    }

    case 'DELETE_BOOTH': {
      const snapshot = { ...state.booths }
      const newBooths = { ...state.booths }
      delete newBooths[action.payload]
      const newSelected = new Set(state.selectedIds)
      newSelected.delete(action.payload)
      return {
        ...state,
        undoStack: [...state.undoStack, snapshot].slice(-20),
        redoStack: [],
        booths: newBooths,
        selectedIds: newSelected,
      }
    }

    case 'ADD_BOOTH': {
      const snapshot = { ...state.booths }
      return {
        ...state,
        undoStack: [...state.undoStack, snapshot].slice(-20),
        redoStack: [],
        booths: { ...state.booths, [action.payload._id]: action.payload },
      }
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state
      const prev = state.undoStack[state.undoStack.length - 1]
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.booths].slice(-20),
        booths: prev,
      }
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state
      const next = state.redoStack[state.redoStack.length - 1]
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, state.booths].slice(-20),
        booths: next,
      }
    }

    case 'SET_SELECTED': {
      const s = new Set(Array.isArray(action.payload) ? action.payload : [action.payload].filter(Boolean))
      return { ...state, selectedIds: s }
    }

    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedIds)
      if (next.has(action.payload)) next.delete(action.payload)
      else next.add(action.payload)
      return { ...state, selectedIds: next }
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set() }

    case 'SET_ZOOM':
      return { ...state, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, action.payload)) }

    case 'SET_PAN':
      return { ...state, panX: action.payload.x, panY: action.payload.y }

    case 'SET_TOOL':
      return { ...state, tool: action.payload, selectedIds: new Set() }

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid }

    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    default:
      return state
  }
}

export default function useFloorPlan(expoId, mode = 'view') {
  const [state, dispatch] = useReducer(reducer, { ...initialState })
  const syncIntervalRef = useRef(null)

  // ── Load halls ──────────────────────────────────────────────
  useEffect(() => {
    if (!expoId) return
    dispatch({ type: 'SET_LOADING', payload: true })
    hallApi.listHallsByExpo(expoId)
      .then(res => {
        const halls = res.data.data?.halls || []
        dispatch({ type: 'SET_HALLS', payload: halls })
        if (halls.length > 0) dispatch({ type: 'SET_ACTIVE_HALL', payload: halls[0]._id })
      })
      .catch(() => dispatch({ type: 'SET_ERROR', payload: 'Failed to load halls' }))
      .finally(() => dispatch({ type: 'SET_LOADING', payload: false }))
  }, [expoId])

  // ── Load FloorPlan Metadata & Booths ────────────────────────
  useEffect(() => {
    if (!state.activeHallId) return

    const loadData = async () => {
      try {
        // Fetch booths
        const boothRes = await boothApi.listBoothsByHall(state.activeHallId)
        dispatch({ type: 'SET_BOOTHS', payload: boothRes.data.data?.booths || [] })

        // Fetch canvas metadata (zoom, pan)
        const fpRes = await floorplanApi.getFloorPlanByHall(state.activeHallId)
        if (fpRes.data?.data?.floorPlan) {
          dispatch({ type: 'SET_FLOORPLAN_SETTINGS', payload: fpRes.data.data.floorPlan })
        }
      } catch (err) {
        console.error('Failed to load floor plan data', err)
      }
    }

    loadData()

    // Setup REST Polling for Booths (Real-time substitute)
    syncIntervalRef.current = setInterval(async () => {
      try {
        const res = await boothApi.listBoothsByHall(state.activeHallId)
        dispatch({ type: 'SET_BOOTHS', payload: res.data.data?.booths || [] })
      } catch (err) {
        // ignore polling errors
      }
    }, 5000)

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [state.activeHallId])


  // ── Actions ─────────────────────────────────────────────────
  const setActiveHall    = useCallback(id  => dispatch({ type: 'SET_ACTIVE_HALL', payload: id }), [])
  const setZoom          = useCallback(z   => dispatch({ type: 'SET_ZOOM',        payload: z  }), [])
  const setPan           = useCallback((x,y)=> dispatch({ type: 'SET_PAN',        payload:{x,y}}), [])
  const setTool          = useCallback(t   => dispatch({ type: 'SET_TOOL',        payload: t  }), [])
  const toggleGrid       = useCallback(()  => dispatch({ type: 'TOGGLE_GRID'                  }), [])
  const toggleFullscreen = useCallback(()  => dispatch({ type: 'TOGGLE_FULLSCREEN'            }), [])
  const undo             = useCallback(()  => dispatch({ type: 'UNDO'                         }), [])
  const redo             = useCallback(()  => dispatch({ type: 'REDO'                         }), [])

  const selectBooth      = useCallback(id  => dispatch({ type: 'SET_SELECTED',     payload: id  }), [])
  const toggleSelect     = useCallback(id  => dispatch({ type: 'TOGGLE_SELECT',    payload: id  }), [])
  const clearSelection   = useCallback(()  => dispatch({ type: 'CLEAR_SELECTION'               }), [])

  const updateBoothLocal  = useCallback(b  => dispatch({ type: 'UPDATE_BOOTH',        payload: b }), [])
  const commitBoothUpdate = useCallback(b  => dispatch({ type: 'UPDATE_BOOTH_COMMIT', payload: b }), [])
  const deleteBoothLocal  = useCallback(id => dispatch({ type: 'DELETE_BOOTH',        payload: id}), [])
  const addBoothLocal     = useCallback(b  => dispatch({ type: 'ADD_BOOTH',           payload: b }), [])

  // Derived: collision detection
  const isPositionOccupied = useCallback((row, col, excludeId = null) => {
    return Object.values(state.booths).some(b => 
      b._id !== excludeId && b.row === row && b.col === col
    )
  }, [state.booths])

  return {
    ...state,
    mode,
    setActiveHall,
    setZoom,
    setPan,
    setTool,
    toggleGrid,
    toggleFullscreen,
    undo,
    redo,
    selectBooth,
    toggleSelect,
    clearSelection,
    updateBoothLocal,
    commitBoothUpdate,
    deleteBoothLocal,
    addBoothLocal,
    isPositionOccupied,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    selectedBooth: state.selectedIds.size === 1 ? state.booths[[...state.selectedIds][0]] : null,
    selectedBooths: [...state.selectedIds].map(id => state.booths[id]).filter(Boolean),
  }
}

