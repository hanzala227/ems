const FloorPlan = require('../models/FloorPlan.model')
const asyncHandler = require('../utils/asyncHandler')
const { ok } = require('../utils/ApiResponse')

// GET /api/floorplans/hall/:hallId
const getFloorPlanByHall = asyncHandler(async (req, res) => {
  let fp = await FloorPlan.findOne({ hallId: req.params.hallId })
  if (!fp) {
    // Return a default virtual object if none created yet
    return ok(res, { floorPlan: { zoom: 1, panX: 0, panY: 0, showGrid: true, elements: [] } })
  }
  ok(res, { floorPlan: fp })
})

// PUT /api/floorplans/hall/:hallId
const saveFloorPlan = asyncHandler(async (req, res) => {
  const { expoId, zoom, panX, panY, showGrid, elements } = req.body
  let fp = await FloorPlan.findOne({ hallId: req.params.hallId })
  
  if (!fp) {
    if (!expoId) return res.status(400).json({ success: false, message: 'expoId is required for creation' })
    fp = await FloorPlan.create({
      hallId: req.params.hallId,
      expoId,
      zoom: zoom ?? 1,
      panX: panX ?? 0,
      panY: panY ?? 0,
      showGrid: showGrid ?? true,
      elements: elements ?? []
    })
  } else {
    if (zoom !== undefined) fp.zoom = zoom
    if (panX !== undefined) fp.panX = panX
    if (panY !== undefined) fp.panY = panY
    if (showGrid !== undefined) fp.showGrid = showGrid
    if (elements !== undefined) fp.elements = elements
    await fp.save()
  }
  
  ok(res, { floorPlan: fp }, 'Floor plan saved')
})

module.exports = { getFloorPlanByHall, saveFloorPlan }
