const Expo = require('../models/Expo.model')
const Application = require('../models/Application.model')
const ExpoRegistration = require('../models/ExpoRegistration.model')
const Booth = require('../models/Booth.model')
const Session = require('../models/Session.model')
const asyncHandler = require('../utils/asyncHandler')
const { ok } = require('../utils/ApiResponse')

// GET /api/analytics/dashboard — organizer stat cards
const getDashboard = asyncHandler(async (req, res) => {
  const organizerId = req.user._id

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalExpos,
    lastMonthExpos,
    expoIds,
  ] = await Promise.all([
    Expo.countDocuments({ organizerId, isDeleted: false }),
    Expo.countDocuments({
      organizerId, isDeleted: false,
      createdAt: { $lt: thirtyDaysAgo }
    }),
    Expo.find({ organizerId, isDeleted: false }).distinct('_id'),
  ])

  const [
    totalApplications,
    lastMonthApplications,
    totalRegistrations,
    lastMonthRegistrations,
    boothStats,
    lastMonthBoothStats,
  ] = await Promise.all([
    Application.countDocuments({ expoId: { $in: expoIds }, status: 'approved' }),
    Application.countDocuments({ expoId: { $in: expoIds }, status: 'approved', appliedAt: { $lt: thirtyDaysAgo } }),
    ExpoRegistration.countDocuments({ expoId: { $in: expoIds }, status: 'registered' }),
    ExpoRegistration.countDocuments({ expoId: { $in: expoIds }, status: 'registered', registeredAt: { $lt: thirtyDaysAgo } }),
    Booth.aggregate([
      { $match: { expoId: { $in: expoIds } } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        occupied: { $sum: { $cond: [{ $in: ['$status', ['occupied', 'reserved']] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, '$price', 0] } },
      }},
    ]),
    Booth.aggregate([
      { $match: { expoId: { $in: expoIds }, updatedAt: { $lt: thirtyDaysAgo } } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, '$price', 0] } },
      }},
    ]),
  ])

  const booth = boothStats[0] || { total: 0, occupied: 0, totalRevenue: 0 }
  const lastMonthBooth = lastMonthBoothStats[0] || { totalRevenue: 0 }
  const occupancyRate = booth.total > 0 ? Math.round((booth.occupied / booth.total) * 100) : 0

  const calcGrowth = (total, old) => old > 0 ? Math.round(((total - old) / old) * 100) : (total > 0 ? 100 : 0)

  ok(res, {
    totalExpos,
    totalExhibitors: totalApplications,
    totalAttendees: totalRegistrations,
    totalRevenue: booth.totalRevenue,
    boothOccupancy: occupancyRate,
    expoGrowth: calcGrowth(totalExpos, lastMonthExpos),
    exhibitorGrowth: calcGrowth(totalApplications, lastMonthApplications),
    attendeeGrowth: calcGrowth(totalRegistrations, lastMonthRegistrations),
    revenueGrowth: calcGrowth(booth.totalRevenue, lastMonthBooth.totalRevenue),
  })
})

// GET /api/analytics/performance?period=7d|30d|90d|1y
const getPerformance = asyncHandler(async (req, res) => {
  const { period = '30d', expoId } = req.query
  const organizerId = req.user._id

  const periodDays = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
  const days = periodDays[period] || 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Get expo IDs for this organizer
  const expoFilter = { organizerId, isDeleted: false }
  if (expoId) expoFilter._id = expoId
  const expoIds = await Expo.find(expoFilter).distinct('_id')

  // Group registrations by date
  const registrations = await ExpoRegistration.aggregate([
    { $match: { expoId: { $in: expoIds }, registeredAt: { $gte: since } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$registeredAt' } },
      count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ])

  // Group applications by date
  const applications = await Application.aggregate([
    { $match: { expoId: { $in: expoIds }, appliedAt: { $gte: since } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
      count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ])

  // Group booth revenue by date
  const revenue = await Booth.aggregate([
    { $match: { expoId: { $in: expoIds }, status: 'occupied', updatedAt: { $gte: since } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
      total: { $sum: '$price' },
    }},
    { $sort: { _id: 1 } },
  ])

  // Merge into unified date-keyed map
  const dataMap = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(since); d.setDate(d.getDate() + i)
    const key = d.toISOString().split('T')[0]
    dataMap[key] = { date: key, registrations: 0, applications: 0, revenue: 0 }
  }
  registrations.forEach(r => { if (dataMap[r._id]) dataMap[r._id].registrations = r.count })
  applications.forEach(a => { if (dataMap[a._id]) dataMap[a._id].applications = a.count })
  revenue.forEach(r => { if (dataMap[r._id]) dataMap[r._id].revenue = r.total })

  ok(res, { chartData: Object.values(dataMap), period })
})

// GET /api/analytics/engagement
const getEngagement = asyncHandler(async (req, res) => {
  const organizerId = req.user._id
  const expoIds = await Expo.find({ organizerId, isDeleted: false }).distinct('_id')

  const [total, boothStats] = await Promise.all([
    ExpoRegistration.countDocuments({ expoId: { $in: expoIds }, status: 'registered' }),
    Booth.aggregate([
      { $match: { expoId: { $in: expoIds }, exhibitorId: { $ne: null } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ])

  const boothByStatus = {}
  boothStats.forEach(b => { boothByStatus[b._id] = b.count })

  // Calculate engagement rate based on occupied booths vs total attendees
  const occupiedCount = boothByStatus['occupied'] || 0
  const engRate = total > 0 ? Math.round((occupiedCount / total) * 100) : 0

  ok(res, {
    totalAttendees: total,
    boothBreakdown: boothByStatus,
    engagementRate: Math.min(100, Math.max(0, engRate)),
  })
})

// GET /api/analytics/occupancy
const getOccupancy = asyncHandler(async (req, res) => {
  const organizerId = req.user._id
  const expos = await Expo.find({ organizerId, isDeleted: false }).select('_id name')
  const expoIds = expos.map(e => e._id)

  const stats = await Booth.aggregate([
    { $match: { expoId: { $in: expoIds } } },
    { $group: {
      _id: '$expoId',
      total: { $sum: 1 },
      occupied: { $sum: { $cond: [{ $in: ['$status', ['occupied', 'reserved']] }, 1, 0] } },
    }},
  ])

  const result = expos.map(expo => {
    const s = stats.find(x => x._id.toString() === expo._id.toString()) || { total: 0, occupied: 0 }
    return {
      expoId: expo._id,
      expoName: expo.name,
      total: s.total,
      occupied: s.occupied,
      rate: s.total > 0 ? Math.round((s.occupied / s.total) * 100) : 0,
    }
  })

  ok(res, { occupancy: result })
})

module.exports = { getDashboard, getPerformance, getEngagement, getOccupancy }
