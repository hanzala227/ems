const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const {
  getNotifications, markRead, markAllRead, deleteNotification, getUnreadCount
} = require('../controllers/notification.controller')

router.use(protect)

router.get('/',              getNotifications)
router.get('/unread-count',  getUnreadCount)
router.patch('/read-all',    markAllRead)
router.patch('/:id/read',    markRead)
router.delete('/:id',        deleteNotification)

module.exports = router
