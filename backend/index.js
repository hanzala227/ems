require('dotenv').config()

const express = require('express')
const http = require('http')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const connectDB = require('./config/db')
const { initSocket } = require('./config/socket')

// Routes
const authRoutes         = require('./routes/auth.routes')
const userRoutes         = require('./routes/user.routes')
const expoRoutes         = require('./routes/expo.routes')
const hallRoutes         = require('./routes/hall.routes')
const boothRoutes        = require('./routes/booth.routes')
const applicationRoutes  = require('./routes/application.routes')
const stageRoutes        = require('./routes/stage.routes')
const sessionRoutes      = require('./routes/session.routes')
const analyticsRoutes    = require('./routes/analytics.routes')
const notificationRoutes = require('./routes/notification.routes')
const messageRoutes      = require('./routes/message.routes')
const registrationRoutes = require('./routes/registration.routes')
const bookingRoutes      = require('./routes/booking.routes')
const floorplanRoutes    = require('./routes/floorplan.routes')

const errorHandler = require('./middleware/error.middleware')

const app = express()
const server = http.createServer(app)

// ─── Full Socket.io setup with JWT auth ───────────────────────
const io = initSocket(server)
app.locals.io = io

// ─── Security & utility middleware ────────────────────────────
app.use(helmet())
app.use(compression())
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/expos',         expoRoutes)
app.use('/api/halls',         hallRoutes)
app.use('/api/booths',        boothRoutes)
app.use('/api/applications',  applicationRoutes)
app.use('/api/stages',        stageRoutes)
app.use('/api/sessions',      sessionRoutes)
app.use('/api/analytics',     analyticsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/messages',      messageRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/bookings',      bookingRoutes)
app.use('/api/floorplans',    floorplanRoutes)

// ─── Global error handler ─────────────────────────────────────
app.use(errorHandler)

// ─── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 EventSphere server running on port ${PORT} [${process.env.NODE_ENV}]`)
  })
})
