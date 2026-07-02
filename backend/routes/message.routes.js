const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth.middleware')
const {
  getConversations, getMessages, sendMessage,
  markConversationRead, getUnreadCount, searchMessages
} = require('../controllers/message.controller')
const { getOnlineUsers } = require('../config/socket')

router.use(protect)

router.get('/search',                searchMessages)
router.get('/conversations',         getConversations)
router.get('/unread-count',          getUnreadCount)
router.get('/online-users', (req, res) => {
  const onlineUserIds = getOnlineUsers()
  res.status(200).json({ success: true, data: { onlineUserIds } })
})
router.get('/:conversationId',       getMessages)
router.post('/',                     sendMessage)
router.patch('/:conversationId/read', markConversationRead)

module.exports = router
