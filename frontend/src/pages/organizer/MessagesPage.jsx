import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { formatDistanceToNow, format } from 'date-fns'
import { Send, Search, MessageSquare, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { setActiveConversation, markConversationRead as markConvReadAction } from '../../app/slices/messageSlice'
import * as msgApi from '../../api/message.api'
import * as userApi from '../../api/user.api'
import useSocket from '../../hooks/useSocket'
import styles from './MessagesPage.module.css'

export default function MessagesPage() {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const currentUser = useSelector(s => s.auth.user)
  const activeConversationId = useSelector(s => s.messages.activeConversationId)
  const { socket, isUserOnline } = useSocket()

  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [messageResults, setMessageResults] = useState([])
  const [messages, setMessages] = useState([])
  const [sendingNew, setSendingNew] = useState(null) // new conversation recipientId
  const messagesContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Load conversations
  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => msgApi.getConversations().then(r => r.data.data),
    refetchInterval: 30000,
  })

  const conversations = convsData?.conversations || []
  const displayConversations = conversations.filter(conv => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return conv.otherUser?.name?.toLowerCase().includes(q) ||
           conv.otherUser?.company?.toLowerCase().includes(q) ||
           conv.lastMessage?.content?.toLowerCase().includes(q);
  });
  const activeConv = conversations.find(c => c.conversationId === activeConversationId)
  const otherUser = activeConv?.otherUser

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversationId) return
    // Check if it's a valid conversation (either in list or properly formatted new conv)
    const isValidConv = conversations.some(c => c.conversationId === activeConversationId) || 
                        (sendingNew && activeConversationId.includes(currentUser?._id))
    if (!isValidConv) {
      // Reset to no active conversation if it's invalid
      dispatch(setActiveConversation(null))
      return
    }
    msgApi.getMessages(activeConversationId)
      .then(r => {
        setMessages(r.data.data?.messages || [])
        // Mark as read
        msgApi.markConversationRead(activeConversationId).catch(() => {})
        dispatch(markConvReadAction(activeConversationId))
        qc.invalidateQueries(['conversations'])
      })
      .catch(() => {
        // If getMessages fails, reset active conv
        dispatch(setActiveConversation(null))
      })
  }, [activeConversationId, conversations, currentUser, dispatch, qc, sendingNew])

  // Scroll to bottom of messages container only when there are messages
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    const onReceive = (msg) => {
      if (msg.conversationId === activeConversationId) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        msgApi.markConversationRead(msg.conversationId).catch(() => {})
      }
      qc.invalidateQueries(['conversations'])
    }

    const onTyping = ({ senderId, senderName, conversationId }) => {
      if (conversationId === activeConversationId) {
        setTypingUser(senderName)
        setIsTyping(true)
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          setTypingUser(null)
        }, 3000)
      }
    }

    const onTypingStop = ({ conversationId }) => {
      if (conversationId === activeConversationId) {
        setIsTyping(false)
        setTypingUser(null)
      }
    }

    socket.on('message:receive', onReceive)
    socket.on('message:typing', onTyping)
    socket.on('message:typing_stop', onTypingStop)

    return () => {
      socket.off('message:receive', onReceive)
      socket.off('message:typing', onTyping)
      socket.off('message:typing_stop', onTypingStop)
    }
  }, [socket, activeConversationId])

  // User and Message search
  useEffect(() => {
    if (userSearch.length < 2) { 
      setSearchResults([]); 
      setMessageResults([]);
      return 
    }
    const t = setTimeout(() => {
      userApi.searchUsers(userSearch)
        .then(r => setSearchResults(r.data.data?.users || []))
        .catch(() => {})
      
      msgApi.searchMessages(userSearch)
        .then(r => setMessageResults(r.data.data?.messages || []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [userSearch])

  const handleTyping = (val) => {
    setMessageInput(val)
    if (!socket || !otherUser) return
    socket.emit('message:typing', {
      recipientId: otherUser._id,
      conversationId: activeConversationId,
    })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('message:typing_stop', {
        recipientId: otherUser._id,
        conversationId: activeConversationId,
      })
    }, 2000)
  }

  const sendMsg = () => {
    if (!messageInput.trim()) return
    const recipientId = otherUser?._id || sendingNew
    if (!recipientId) return

    // Optimistic
    const optimistic = {
      _id: `opt_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      content: messageInput.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      optimistic: true,
    }
    setMessages(prev => [...prev, optimistic])
    const content = messageInput.trim()
    setMessageInput('')

    if (socket?.connected) {
      const convId = activeConversationId || [currentUser._id, recipientId].sort().join(':')
      socket.emit('message:send', { recipientId, content, conversationId: convId })
      
      const onSent = (msg) => {
        socket.off('message:error', onError)
        setMessages(prev => prev.map(m => m._id === optimistic._id ? msg : m))
        if (!activeConversationId) {
          dispatch(setActiveConversation(msg.conversationId))
        }
        qc.invalidateQueries(['conversations'])
      }
      
      const onError = (err) => {
        socket.off('message:sent', onSent)
        toast.error(err?.error || 'Failed to send message')
        setMessages(prev => prev.filter(m => m._id !== optimistic._id))
        setMessageInput(content) // Restore input
      }

      socket.once('message:sent', onSent)
      socket.once('message:error', onError)

    } else {
      // REST fallback
      msgApi.sendMessage({ recipientId, content })
        .then(r => {
          const msg = r.data.data?.message
          setMessages(prev => prev.map(m => m._id === optimistic._id ? msg : m))
          if (!activeConversationId) dispatch(setActiveConversation(msg.conversationId))
          qc.invalidateQueries(['conversations'])
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message || 'Failed to send message')
          setMessages(prev => prev.filter(m => m._id !== optimistic._id))
          setMessageInput(content) // Restore input
        })
    }
    setSendingNew(null)
  }

  const openConversation = (conv) => {
    dispatch(setActiveConversation(conv.conversationId))
    setMessages([])
    setUserSearch('')
    setSearchResults([])
  }

  const startNewConversation = (user) => {
    const convId = [currentUser._id, user._id].sort().join(':')
    setSendingNew(user._id)
    dispatch(setActiveConversation(convId))
    setMessages([])
    setSearchResults([])
    setUserSearch('')
  }

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Messages</h2>
        </div>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Find or start a conversation..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
        </div>

        {/* User search results */}
        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            <p style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contacts</p>
            {searchResults.map(u => (
              <button key={u._id} className={styles.searchUser} onClick={() => startNewConversation(u)}>
                <div className={styles.convAvatar}>
                  {u.avatar ? <img src={u.avatar} alt="" /> : u.name[0]}
                  <div className={isUserOnline(u._id) ? styles.onlineDot : styles.offlineDot} />
                </div>
                <div>
                  <span className={styles.convName}>{u.name}</span>
                  <span className={styles.convRole}>{u.role}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Message search results */}
        {messageResults.length > 0 && (
          <div className={styles.searchResults}>
            <p style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Messages</p>
            {messageResults.map(msg => {
              const u = msg.senderId?._id === currentUser?._id ? msg.recipientId : msg.senderId;
              if (!u) return null;
              return (
                <button key={msg._id} className={styles.searchUser} onClick={() => openConversation({ conversationId: msg.conversationId })}>
                  <div className={styles.convAvatar}>
                    {u.avatar ? <img src={u.avatar} alt="" /> : u.name[0]}
                  </div>
                  <div className={styles.convInfo}>
                    <span className={styles.convName}>{u.name}</span>
                    <span className={styles.convPreview}>{msg.content.substring(0, 40)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Conversations */}
        {convsLoading ? (
          <Skeleton count={4} height={64} style={{ margin: '4px 12px' }} />
        ) : conversations.length === 0 && !userSearch ? (
          <div className={styles.emptyConvs}>
            <MessageSquare size={32} />
            <p>No conversations yet</p>
            <p>Search for a user to start</p>
          </div>
        ) : (
          <div className={styles.convList}>
            {displayConversations.map(conv => (
              <button
                key={conv.conversationId}
                className={`${styles.convItem} ${activeConversationId === conv.conversationId ? styles.activeConv : ''}`}
                onClick={() => openConversation(conv)}
              >
                <div className={styles.convAvatar}>
                  {conv.otherUser?.avatar
                    ? <img src={conv.otherUser.avatar} alt="" />
                    : (conv.otherUser?.name?.[0] || '?')
                  }
                  <div className={isUserOnline(conv.otherUser?._id) ? styles.onlineDot : styles.offlineDot} />
                </div>
                <div className={styles.convInfo}>
                  <div className={styles.convTop}>
                    <span className={styles.convName}>{conv.otherUser?.company || conv.otherUser?.name}</span>
                    <span className={styles.convTime}>
                      {conv.lastMessage?.createdAt
                        ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })
                        : ''}
                    </span>
                  </div>
                  <div className={styles.convBottom}>
                    <span className={styles.convPreview}>
                      {conv.lastMessage?.senderId?.toString() === currentUser?._id
                        ? `You: ${conv.lastMessage?.content?.substring(0, 30)}`
                        : conv.lastMessage?.content?.substring(0, 35)
                      }
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat window */}
      <div className={`${styles.chatWindow} ${activeConversationId ? styles.chatWindowActive : ''}`}>
        {!activeConversationId ? (
          <div className={styles.emptyChat}>
            <MessageSquare size={48} />
            <h3>Select a conversation</h3>
            <p>Or search for a user to start a new conversation</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className={styles.chatHeader}>
              <button 
                className={styles.backBtn}
                onClick={() => dispatch(setActiveConversation(null))}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-text-primary)', 
                  cursor: 'pointer', 
                  padding: '4px',
                  marginRight: '8px'
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div className={styles.chatAvatar}>
                {otherUser?.avatar
                  ? <img src={otherUser.avatar} alt="" />
                  : (otherUser?.name?.[0] || sendingNew?.[0] || '?')
                }
                <div className={isUserOnline(otherUser?._id || sendingNew) ? styles.onlineDot : styles.offlineDot} />
              </div>
              <div>
                <p className={styles.chatName}>{otherUser?.company || otherUser?.name || 'New Conversation'}</p>
                <p className={styles.chatRole}>{otherUser?.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages} ref={messagesContainerRef}>
              {messages.map(msg => {
                const isMine = msg.senderId?._id === currentUser?._id || msg.senderId === currentUser?._id
                return (
                  <div key={msg._id} className={`${styles.msgRow} ${isMine ? styles.mine : styles.theirs}`}>
                    {!isMine && (
                      <div className={styles.msgAvatar}>
                        {msg.senderId?.avatar
                          ? <img src={msg.senderId.avatar} alt="" />
                          : msg.senderId?.name?.[0]}
                      </div>
                    )}
                    <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs} ${msg.optimistic ? styles.optimistic : ''}`}>
                      <p>{msg.content}</p>
                      <span className={styles.msgTime}>
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className={styles.typingIndicator}>
                  <span>{typingUser} is typing</span>
                  <span className={styles.dots}><span/><span/><span/></span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className={styles.inputRow}>
              <input
                className={styles.chatInput}
                placeholder="Type a message..."
                value={messageInput}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMsg())}
              />
              <button className={styles.sendBtn} onClick={sendMsg} disabled={!messageInput.trim()}>
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
