/**
 * EventSphere — Production Seed Script
 * Run: node backend/seed.js
 *
 * Creates realistic data for all models:
 * User, Expo, Hall, Booth, Stage, Session, SessionBooking,
 * Application, ExpoRegistration, FloorPlan, Notification, Message
 */

require('dotenv').config({ path: __dirname + '/.env' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// ── Models ───────────────────────────────────────────────────────
const User            = require('./models/User.model')
const Expo            = require('./models/Expo.model')
const Hall            = require('./models/Hall.model')
const Booth           = require('./models/Booth.model')
const Stage           = require('./models/Stage.model')
const Session         = require('./models/Session.model')
const SessionBooking  = require('./models/SessionBooking.model')
const Application     = require('./models/Application.model')
const ExpoRegistration = require('./models/ExpoRegistration.model')
const FloorPlan       = require('./models/FloorPlan.model')
const Notification    = require('./models/Notification.model')
const Message         = require('./models/Message.model')

// ── Helpers ──────────────────────────────────────────────────────
const rand   = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randN  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000)
const daysAhead = (n) => new Date(Date.now() + n * 86_400_000)

async function seed() {
  console.log('🔗 Connecting to MongoDB…')
  await mongoose.connect(process.env.MONGO_URL)
  console.log('✅ Connected')

  // ── Wipe existing data ─────────────────────────────────────────
  console.log('🗑️  Clearing existing data…')
  await Promise.all([
    User.deleteMany({}),
    Expo.deleteMany({}),
    Hall.deleteMany({}),
    Booth.deleteMany({}),
    Stage.deleteMany({}),
    Session.deleteMany({}),
    SessionBooking.deleteMany({}),
    Application.deleteMany({}),
    ExpoRegistration.deleteMany({}),
    FloorPlan.deleteMany({}),
    Notification.deleteMany({}),
    Message.deleteMany({}),
  ])

  const pw = await bcrypt.hash('Password123!', 10)

  // ── 1. USERS ───────────────────────────────────────────────────
  console.log('👤 Creating users…')

  // 1 organizer
  const organizer = await User.create({
    name: 'Alice Johnson',
    email: 'organizer@eventsphere.com',
    password: pw,
    role: 'organizer',
    company: 'EventSphere HQ',
    bio: 'Head of event operations at EventSphere. 10+ years managing global tech expos.',
    phone: '+1 (555) 001-0001',
    website: 'https://eventsphere.com',
    industry: 'Event Management',
  })

  // 12 exhibitors
  const exhibitorData = [
    { name: 'TechCorp Inc.',       email: 'techcorp@ex.com',      company: 'TechCorp Inc.',       industry: 'Technology' },
    { name: 'InnovateLabs',        email: 'innovate@ex.com',       company: 'InnovateLabs',        industry: 'Technology' },
    { name: 'FutureSoft',          email: 'futuresoft@ex.com',     company: 'FutureSoft',          industry: 'Software' },
    { name: 'GreenTech Solutions', email: 'greentech@ex.com',      company: 'GreenTech Solutions', industry: 'Sustainability' },
    { name: 'DataVision Analytics',email: 'datavision@ex.com',     company: 'DataVision Analytics',industry: 'Analytics' },
    { name: 'NovaBots',            email: 'novabots@ex.com',       company: 'NovaBots',            industry: 'Robotics' },
    { name: 'CloudWave Systems',   email: 'cloudwave@ex.com',      company: 'CloudWave Systems',   industry: 'Cloud Computing' },
    { name: 'Nexgen Medical',      email: 'nexgen@ex.com',         company: 'Nexgen Medical',      industry: 'Healthcare' },
    { name: 'BioTech Research',    email: 'biotech@ex.com',        company: 'BioTech Research',    industry: 'Biotechnology' },
    { name: 'EcoMaterials Co.',    email: 'ecomaterials@ex.com',   company: 'EcoMaterials Co.',    industry: 'Manufacturing' },
    { name: 'SmartRetail Ltd.',    email: 'smartretail@ex.com',    company: 'SmartRetail Ltd.',    industry: 'Retail Tech' },
    { name: 'FinEdge Capital',     email: 'finedge@ex.com',        company: 'FinEdge Capital',     industry: 'Fintech' },
  ]
  const exhibitors = await User.insertMany(
    exhibitorData.map(d => ({ ...d, password: pw, role: 'exhibitor', bio: `Leading company in ${d.industry}.` }))
  )

  // 20 attendees
  const attendeeNames = [
    'James Carter', 'Maria Garcia', 'Liam Nguyen', 'Sophia Patel', 'Noah Kim',
    'Olivia Chen', 'Ethan Brown', 'Isabella Davis', 'Mason Wilson', 'Ava Martinez',
    'Logan Taylor', 'Emma Anderson', 'Lucas Thomas', 'Mia Jackson', 'Aiden White',
    'Harper Harris', 'Elijah Lewis', 'Evelyn Robinson', 'Alexander Lee', 'Abigail Walker',
  ]
  const attendees = await User.insertMany(
    attendeeNames.map((name, i) => ({
      name,
      email: `attendee${i + 1}@eventsphere.com`,
      password: pw,
      role: 'attendee',
      bio: `Tech enthusiast and professional attending EventSphere expos.`,
    }))
  )

  // ── 2. EXPOS ───────────────────────────────────────────────────
  console.log('🎪 Creating expos…')

  const baseExpos = [
    { name: 'Tech Innovation Expo', category: 'Technology', theme: 'Future of Technology' },
    { name: 'Global Startup Summit', category: 'Startup', theme: 'Innovation & Entrepreneurship' },
    { name: 'AI & Robotics Expo', category: 'AI/ML', theme: 'Intelligent Automation' },
    { name: 'SustainTech World Fair', category: 'Sustainability', theme: 'Sustainability & CleanTech' },
    { name: 'FinTech & Blockchain Forum', category: 'Fintech', theme: 'Future of Finance' },
    { name: 'HealthTech Connect', category: 'Healthcare', theme: 'Digital Health Revolution' },
    { name: 'E-Commerce Global', category: 'Retail Tech', theme: 'Future of Shopping' },
    { name: 'CyberSecurity Summit', category: 'Technology', theme: 'Securing the Digital World' },
    { name: 'EdTech Innovators', category: 'Technology', theme: 'Future of Education' },
    { name: 'AgriTech Expo', category: 'Sustainability', theme: 'Sustainable Farming' },
  ]

  const expoTemplates = []
  for (let i = 0; i < 15; i++) {
    const base = baseExpos[i % baseExpos.length]
    const year = 2024 + Math.floor(i / baseExpos.length)
    
    // Distribute statuses: Draft, Published, Live, Ended, Cancelled
    let status = 'Published'
    let start, end
    const randStat = Math.random()
    if (randStat < 0.15) {
      status = 'Ended'
      start = daysAgo(randN(20, 100))
      end = new Date(start.getTime() + randN(2, 5) * 86400000)
    } else if (randStat < 0.3) {
      status = 'Live'
      start = daysAgo(1)
      end = daysAhead(2)
    } else if (randStat < 0.8) {
      status = 'Published'
      start = daysAhead(randN(5, 60))
      end = new Date(start.getTime() + randN(2, 5) * 86400000)
    } else {
      status = 'Draft'
      start = daysAhead(randN(30, 90))
      end = new Date(start.getTime() + randN(2, 5) * 86400000)
    }

    expoTemplates.push({
      name: `${base.name} ${year} - Vol ${i+1}`,
      description: `The premier global event showcasing cutting-edge innovations in ${base.category}. Join thousands of industry leaders, startups, and investors for days of demos, keynotes, and networking.`,
      theme: base.theme,
      category: base.category,
      location: { address: `${randN(100, 999)} Expo Blvd`, city: rand(['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Singapore', 'Dubai']), country: rand(['USA', 'UK', 'Germany', 'Japan', 'Singapore', 'UAE']) },
      startDate: start,
      endDate: end,
      capacity: rand([300, 500, 1000, 2000, 5000]),
      status,
    })
  }

  const expos = await Expo.insertMany(
    expoTemplates.map(t => ({
      ...t,
      organizerId: organizer._id,
      registeredCount: randN(50, t.capacity - 50),
    }))
  )

  // ── 3. HALLS ───────────────────────────────────────────────────
  console.log('🏛️  Creating halls…')

  const hallsData = []
  // Create 2-3 halls per expo
  for (const expo of expos) {
    const count = randN(3, 5)
    for (let i = 1; i <= count; i++) {
      hallsData.push({
        name: `Hall ${String.fromCharCode(64 + i)}`,
        expoId: expo._id,
        organizerId: organizer._id,
        floorNumber: i,
        rows: randN(5, 10),
        columns: randN(8, 15),
        description: `Hall ${String.fromCharCode(64 + i)} — main exhibition space for ${expo.name}.`,
      })
    }
  }
  const halls = await Hall.insertMany(hallsData)

  // ── 4. BOOTHS ──────────────────────────────────────────────────
  console.log('🛖  Creating booths…')

  const allBooths = []
  const boothStatuses = ['available', 'reserved', 'occupied', 'pending', 'blocked']
  const boothWeights  = [0.25, 0.15, 0.40, 0.15, 0.05] // realistic distribution

  for (const hall of halls) {
    for (let row = 1; row <= hall.rows; row++) {
      for (let col = 1; col <= hall.columns; col++) {
        const rand01 = Math.random()
        let cumulative = 0
        let status = 'available'
        for (let s = 0; s < boothStatuses.length; s++) {
          cumulative += boothWeights[s]
          if (rand01 < cumulative) { status = boothStatuses[s]; break }
        }

        // assign an exhibitor if occupied
        const exhibitor = status === 'occupied' ? rand(exhibitors) : null

        allBooths.push({
          boothNumber: `${hall.name.replace('Hall ', '')}-${String(row).padStart(2, '0')}${String(col).padStart(2, '0')}`,
          hallId: hall._id,
          expoId: hall.expoId,
          exhibitorId: exhibitor?._id || null,
          row,
          col,
          status,
          price: rand([500, 750, 1000, 1500, 2000, 2500]),
          notes: status === 'blocked' ? 'Reserved for emergency access' : '',
        })
      }
    }
  }
  await Booth.insertMany(allBooths)

  // ── 5. STAGES ──────────────────────────────────────────────────
  console.log('🎤  Creating stages…')

  const stageNames = ['Main Stage', 'Conference Room A', 'Hall B – Stage', 'Networking Lounge', 'Workshop Room 1']
  const stagesData = []
  for (const expo of expos) {
    const count = randN(5, 10)
    for (let i = 0; i < count; i++) {
      stagesData.push({
        name: stageNames[i] || `Stage ${i + 1}`,
        expoId: expo._id,
        capacity: rand([100, 200, 300, 500, 800]),
        description: `${stageNames[i] || 'Stage'} for ${expo.name} — premium seating available.`,
        location: `${expo.location?.city}, ${expo.location?.country}`,
      })
    }
  }
  const stages = await Stage.insertMany(stagesData)

  // ── 6. SESSIONS ────────────────────────────────────────────────
  console.log('📅  Creating sessions…')

  const sessionTitles = [
    'Keynote: The Future of AI',
    'Tech Innovation Panel',
    'Startup Pitch Competition',
    'Networking Session',
    'Workshop: Building with LLMs',
    'Fireside Chat: Scaling Startups',
    'Product Demo Showcase',
    'Investor Q&A Panel',
    'Cybersecurity in the Modern Age',
    'Sustainability & Tech',
    'Robotics Live Demo',
    'Career in Tech – Panel',
    'Blockchain & DeFi Deep Dive',
    'Healthcare Innovation Summit',
    'Open Source Community Talk',
  ]

  const sessionStatuses = ['Scheduled', 'Scheduled', 'Scheduled', 'Live', 'Ended']
  const sessionsData = []
  for (const expo of expos) {
    const expoStages = stages.filter(s => s.expoId.toString() === expo._id.toString())
    const count = randN(10, 20)
    for (let i = 0; i < count; i++) {
      const baseHour = 9 + i * 1.5
      const start = new Date(expo.startDate)
      start.setHours(Math.floor(baseHour), (baseHour % 1) * 60, 0, 0)
      const end = new Date(start.getTime() + 90 * 60 * 1000) // 90 min sessions
      const capacity = rand([100, 150, 200, 300])
      sessionsData.push({
        title: sessionTitles[i % sessionTitles.length],
        description: `An in-depth session covering the latest trends and breakthroughs. Open to all registered attendees.`,
        expoId: expo._id,
        stageId: rand(expoStages)?._id || expoStages[0]?._id,
        speakerName: rand(['Dr. Sarah Mitchell', 'Prof. James Lin', 'CEO Mark Davis', 'CTO Elena Vasquez', 'VP Ravi Sharma']),
        speakerBio: 'Industry veteran with 15+ years of experience in the field.',
        startTime: start,
        endTime: end,
        capacity,
        bookedCount: randN(10, capacity - 10),
        status: rand(sessionStatuses),
      })
    }
  }
  const sessions = await Session.insertMany(sessionsData)

  // ── 7. APPLICATIONS ────────────────────────────────────────────
  console.log('📋  Creating applications…')

  const categories = ['Technology', 'Software', 'Sustainability', 'Analytics', 'Healthcare', 'Fintech', 'Robotics', 'AI/ML']
  const appStatuses = ['pending', 'pending', 'approved', 'approved', 'approved', 'rejected']
  const applicationsData = []

  for (const expo of expos) {
    const expoHalls = halls.filter(h => h.expoId.toString() === expo._id.toString())
    // Each exhibitor applies to 2-3 expos
    for (const exhibitor of exhibitors) {
      if (Math.random() > 0.1) { // 90% chance each exhibitor applies
        const hall = rand(expoHalls)
        const col = randN(1, hall?.columns || 8)
        applicationsData.push({
          expoId: expo._id,
          exhibitorId: exhibitor._id,
          status: rand(appStatuses),
          companyDescription: `${exhibitor.company} is a leading provider of innovative solutions in the ${exhibitor.industry} space. We look forward to showcasing our latest products and connecting with industry professionals.`,
          category: exhibitor.industry || rand(categories),
          boothPreference: hall ? `${hall.name} – ${String.fromCharCode(64 + col)}${randN(1, 8)}` : '',
          specialRequirements: rand(['Corner booth preferred', 'Power outlet required', 'Large display space needed', 'None', 'None', 'None']),
          appliedAt: daysAgo(randN(1, 30)),
        })
      }
    }
  }
  const applications = await Application.insertMany(applicationsData)

  // ── 8. EXPO REGISTRATIONS ──────────────────────────────────────
  console.log('✅  Creating expo registrations…')

  const regData = []
  const seen = new Set()
  for (const attendee of attendees) {
    const numExpos = randN(5, 12)
    const shuffled = [...expos].sort(() => Math.random() - 0.5).slice(0, numExpos)
    for (const expo of shuffled) {
      const key = `${expo._id}-${attendee._id}`
      if (!seen.has(key)) {
        seen.add(key)
        regData.push({
          expoId: expo._id,
          attendeeId: attendee._id,
          status: Math.random() > 0.05 ? 'registered' : 'cancelled',
          registeredAt: daysAgo(randN(1, 25)),
        })
      }
    }
  }
  await ExpoRegistration.insertMany(regData)

  // ── 9. SESSION BOOKINGS ────────────────────────────────────────
  console.log('🎟️  Creating session bookings…')

  const bookingData = []
  const bookingSeen = new Set()
  for (const attendee of attendees) {
    const numSessions = randN(10, 30)
    const shuffled = [...sessions].sort(() => Math.random() - 0.5).slice(0, numSessions)
    for (const session of shuffled) {
      const key = `${session._id}-${attendee._id}`
      if (!bookingSeen.has(key)) {
        bookingSeen.add(key)
        bookingData.push({
          sessionId: session._id,
          attendeeId: attendee._id,
          expoId: session.expoId,
          bookedAt: daysAgo(randN(1, 20)),
        })
      }
    }
  }
  await SessionBooking.insertMany(bookingData)

  // ── 10. FLOOR PLANS ────────────────────────────────────────────
  console.log('🗺️  Creating floor plan metadata…')

  const floorPlanData = halls.map(hall => ({
    hallId: hall._id,
    expoId: hall.expoId,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    showGrid: true,
    elements: [],
  }))
  await FloorPlan.insertMany(floorPlanData)

  // ── 11. NOTIFICATIONS ──────────────────────────────────────────
  console.log('🔔  Creating notifications…')

  const notifData = []

  // Notifications for organizer
  const orgNotifs = [
    { type: 'new_application', title: 'New Application Received', message: 'TechCorp Inc. has applied for a booth at Tech Innovation Expo 2024.' },
    { type: 'application_approved', title: 'Application Approved', message: 'You approved InnovateLabs application for booth Hall A-A3.' },
    { type: 'expo_published', title: 'Expo Published', message: 'Global Startup Summit 2024 is now live and accepting registrations.' },
    { type: 'booth_assigned', title: 'Booth Assigned', message: 'FutureSoft has been assigned to Hall B-B05.' },
    { type: 'session_live', title: 'Session Started', message: 'Keynote: The Future of AI is now live on Main Stage.' },
    { type: 'registration_milestone', title: 'Registration Milestone', message: 'Tech Innovation Expo 2024 has reached 200 attendee registrations!' },
  ]
  orgNotifs.forEach(n => notifData.push({ ...n, recipientId: organizer._id, isRead: Math.random() > 0.4 }))

  // Notifications for exhibitors
  for (const exhibitor of exhibitors.slice(0, 6)) {
    notifData.push({
      type: 'application_status',
      title: 'Application Update',
      message: 'Your booth application for Tech Innovation Expo 2024 has been reviewed.',
      recipientId: exhibitor._id,
      isRead: Math.random() > 0.5,
    })
    notifData.push({
      type: 'expo_reminder',
      title: 'Expo Starting Soon',
      message: 'Tech Innovation Expo 2024 starts in 3 days. Please confirm your setup time.',
      recipientId: exhibitor._id,
      isRead: false,
    })
  }

  // Notifications for attendees
  for (const attendee of attendees.slice(0, 10)) {
    notifData.push({
      type: 'session_reminder',
      title: 'Session Reminder',
      message: 'Your booked session "Keynote: The Future of AI" starts in 1 hour.',
      recipientId: attendee._id,
      isRead: Math.random() > 0.3,
    })
    notifData.push({
      type: 'expo_reminder',
      title: 'Expo Tomorrow',
      message: 'Tech Innovation Expo 2024 starts tomorrow! Don\'t forget to check the schedule.',
      recipientId: attendee._id,
      isRead: false,
    })
  }

  await Notification.insertMany(notifData)

  // ── 12. MESSAGES ───────────────────────────────────────────────
  console.log('💬  Creating messages…')

  const msgData = []
  // Organizer ↔ Exhibitors conversations
  for (const exhibitor of exhibitors.slice(0, 5)) {
    const convoId = [organizer._id.toString(), exhibitor._id.toString()].sort().join(':')
    msgData.push(
      {
        senderId: organizer._id,
        recipientId: exhibitor._id,
        content: `Hi ${exhibitor.name.split(' ')[0]}, welcome to EventSphere! Your application for Tech Innovation Expo 2024 is under review. We'll update you within 48 hours.`,
        conversationId: convoId,
        isRead: true,
        createdAt: daysAgo(5),
      },
      {
        senderId: exhibitor._id,
        recipientId: organizer._id,
        content: `Thank you! We're excited to participate. Please let us know if you need any additional documents from us.`,
        conversationId: convoId,
        isRead: true,
        createdAt: daysAgo(4),
      },
      {
        senderId: organizer._id,
        recipientId: exhibitor._id,
        content: `Great! Your application has been approved. You've been assigned to Hall A. Setup day is the day before the expo opens.`,
        conversationId: convoId,
        isRead: Math.random() > 0.5,
        createdAt: daysAgo(2),
      }
    )
  }

  // Exhibitor ↔ Attendee conversations
  for (let i = 0; i < 4; i++) {
    const convoId = [attendees[i]._id.toString(), exhibitors[i]._id.toString()].sort().join(':')
    msgData.push(
      {
        senderId: attendees[i]._id,
        recipientId: exhibitors[i]._id,
        content: `Hello, I saw your booth at the expo. Can you tell me more about your latest product?`,
        conversationId: convoId,
        isRead: true,
        createdAt: daysAgo(3),
      },
      {
        senderId: exhibitors[i]._id,
        recipientId: attendees[i]._id,
        content: `Hi! Absolutely. We'd love to give you a full demo. Are you available tomorrow at 2 PM at our booth?`,
        conversationId: convoId,
        isRead: Math.random() > 0.4,
        createdAt: daysAgo(2),
      }
    )
  }

  await Message.insertMany(msgData)

  // ── Summary ────────────────────────────────────────────────────
  console.log('\n🌱 Seed complete! Summary:')
  console.log(`   Users:            ${1 + exhibitors.length + attendees.length} (1 organizer, ${exhibitors.length} exhibitors, ${attendees.length} attendees)`)
  console.log(`   Expos:            ${expos.length}`)
  console.log(`   Halls:            ${halls.length}`)
  console.log(`   Booths:           ${allBooths.length}`)
  console.log(`   Stages:           ${stages.length}`)
  console.log(`   Sessions:         ${sessions.length}`)
  console.log(`   Session Bookings: ${bookingData.length}`)
  console.log(`   Applications:     ${applications.length}`)
  console.log(`   Registrations:    ${regData.length}`)
  console.log(`   Floor Plans:      ${floorPlanData.length}`)
  console.log(`   Notifications:    ${notifData.length}`)
  console.log(`   Messages:         ${msgData.length}`)
  console.log('\n🔑 Login credentials:')
  console.log('   Organizer:  organizer@eventsphere.com / Password123!')
  console.log('   Exhibitor:  techcorp@ex.com          / Password123!')
  console.log('   Attendee:   attendee1@eventsphere.com / Password123!')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
