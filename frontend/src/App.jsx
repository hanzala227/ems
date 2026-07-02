import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'

import { initAuth } from './app/slices/authSlice'
import AuthGuard from './components/layout/AuthGuard'
import GuestGuard from './components/layout/GuestGuard'
import Spinner from './components/ui/Spinner/Spinner'

// ── Layouts ────────────────────────────────────────────────────
const DashboardLayout    = lazy(() => import('./layouts/DashboardLayout'))
const AuthLayout         = lazy(() => import('./layouts/AuthLayout'))

// ── Public ────────────────────────────────────────────────────
const LandingPage        = lazy(() => import('./pages/public/LandingPage'))
const LoginPage          = lazy(() => import('./pages/public/LoginPage'))
const RegisterPage       = lazy(() => import('./pages/public/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('./pages/public/ResetPasswordPage'))
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage'))

// ── Organizer ─────────────────────────────────────────────────
const OrgDashboardPage       = lazy(() => import('./pages/organizer/OrgDashboardPage'))
const ExposPage              = lazy(() => import('./pages/organizer/ExposPage'))
const CreateExpoPage         = lazy(() => import('./pages/organizer/CreateExpoPage'))
const ExpoDetailPage         = lazy(() => import('./pages/organizer/ExpoDetailPage'))
const ApplicationsPage       = lazy(() => import('./pages/organizer/ApplicationsPage'))
const FloorPlanEditorPage    = lazy(() => import('./pages/organizer/FloorPlanEditorPage'))
const OrgFloorPlanSelectPage = lazy(() => import('./pages/organizer/OrgFloorPlanSelectPage'))
const SchedulePage           = lazy(() => import('./pages/organizer/SchedulePage'))
const AttendeesPage          = lazy(() => import('./pages/organizer/AttendeesPage'))
const AnalyticsPage          = lazy(() => import('./pages/organizer/AnalyticsPage'))
const ReportsPage            = lazy(() => import('./pages/organizer/ReportsPage'))
const MessagesPage           = lazy(() => import('./pages/organizer/MessagesPage'))
const NotificationsPage      = lazy(() => import('./pages/organizer/NotificationsPage'))
const SettingsPage           = lazy(() => import('./pages/organizer/SettingsPage'))
const UsersRolesPage         = lazy(() => import('./pages/organizer/UsersRolesPage'))
// Additional organizer pages
const OrgExhibitorsPage      = lazy(() => import('./pages/organizer/OrgExhibitorsPage'))
const OrgFeedbackPage        = lazy(() => import('./pages/organizer/OrgFeedbackPage'))
const OrgIntegrationsPage    = lazy(() => import('./pages/organizer/OrgIntegrationsPage'))

// ── Exhibitor ─────────────────────────────────────────────────
const ExhDashboardPage    = lazy(() => import('./pages/exhibitor/ExhDashboardPage'))
const ExhProfilePage      = lazy(() => import('./pages/exhibitor/ExhProfilePage'))
const BrowseExposPage     = lazy(() => import('./pages/exhibitor/BrowseExposPage'))
const ExhApplicationsPage = lazy(() => import('./pages/exhibitor/ExhApplicationsPage'))
const MyBoothPage         = lazy(() => import('./pages/exhibitor/MyBoothPage'))
const BoothSelectionPage  = lazy(() => import('./pages/exhibitor/BoothSelectionPage'))
const ExhFloorPlanViewerPage = lazy(() => import('./pages/exhibitor/ExhFloorPlanViewerPage'))

// ── Attendee ──────────────────────────────────────────────────
const AttDashboardPage    = lazy(() => import('./pages/attendee/AttDashboardPage'))
const BrowseEventsPage    = lazy(() => import('./pages/attendee/BrowseEventsPage'))
const EventDetailPage     = lazy(() => import('./pages/attendee/EventDetailPage'))
const BookingsPage        = lazy(() => import('./pages/attendee/BookingsPage'))
const FloorPlanViewerPage = lazy(() => import('./pages/attendee/FloorPlanViewerPage'))
const AttSchedulePage     = lazy(() => import('./pages/attendee/AttSchedulePage'))
const AttProfilePage      = lazy(() => import('./pages/attendee/AttProfilePage'))
const AttExhibitorsPage   = lazy(() => import('./pages/attendee/AttExhibitorsPage'))

// ── Full-page loading fallback ─────────────────────────────────
const PageLoader = () => (
  <div className="page-spinner">
    <Spinner size="lg" />
  </div>
)

export default function App() {
  const dispatch = useDispatch()
  const { isLoading } = useSelector((s) => s.auth)
  const location = useLocation()

  useEffect(() => {
    dispatch(initAuth())
  }, [dispatch])

  if (isLoading) return <PageLoader />

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111420',
            color: '#eef0f8',
            border: '1px solid #1e2235',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#111420' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#111420' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>

          {/* ── Public ──────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />

            <Route element={<GuestGuard><AuthLayout /></GuestGuard>}>
              <Route path="/login"                 element={<LoginPage />} />
              <Route path="/register"              element={<RegisterPage />} />
              <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            </Route>

            {/* ── Organizer ───────────────────────────────── */}
            <Route path="/organizer" element={<AuthGuard role="organizer"><DashboardLayout /></AuthGuard>}>
              <Route index                          element={<OrgDashboardPage />} />
              <Route path="expos"                   element={<ExposPage />} />
              <Route path="expos/create"            element={<CreateExpoPage />} />
              <Route path="expos/:id"               element={<ExpoDetailPage />} />
              <Route path="expos/:id/applications"  element={<ApplicationsPage />} />
              <Route path="expos/:id/floor-plan"    element={<FloorPlanEditorPage />} />
              <Route path="expos/:id/schedule"      element={<SchedulePage />} />
              <Route path="expos/:id/attendees"     element={<AttendeesPage />} />
              {/* Additional organizer routes */}
              <Route path="floor-plan"              element={<OrgFloorPlanSelectPage />} />
              <Route path="exhibitors"              element={<OrgExhibitorsPage />} />
              <Route path="attendees"               element={<AttendeesPage />} />
              <Route path="analytics"               element={<AnalyticsPage />} />
              <Route path="reports"                 element={<ReportsPage />} />
              <Route path="messages"                element={<MessagesPage />} />
              <Route path="notifications"           element={<NotificationsPage />} />
              <Route path="feedback"                element={<OrgFeedbackPage />} />
              <Route path="settings"                element={<SettingsPage />} />
              <Route path="users-roles"             element={<UsersRolesPage />} />
              <Route path="integrations"            element={<OrgIntegrationsPage />} />
            </Route>

            {/* ── Exhibitor ───────────────────────────────── */}
            <Route path="/exhibitor" element={<AuthGuard role="exhibitor"><DashboardLayout /></AuthGuard>}>
              <Route index                            element={<ExhDashboardPage />} />
              <Route path="profile"                   element={<ExhProfilePage />} />
              <Route path="expos"                     element={<BrowseExposPage />} />
              <Route path="applications"              element={<ExhApplicationsPage />} />
              <Route path="my-booth"                  element={<MyBoothPage />} />
              <Route path="floor-plan"                element={<ExhFloorPlanViewerPage />} />
              <Route path="booth-selection/:expoId"   element={<BoothSelectionPage />} />
              <Route path="messages"                  element={<MessagesPage />} />
              <Route path="notifications"             element={<NotificationsPage />} />
              <Route path="settings"                  element={<SettingsPage />} />
            </Route>

            {/* ── Attendee ────────────────────────────────── */}
            <Route path="/attendee" element={<AuthGuard role="attendee"><DashboardLayout /></AuthGuard>}>
              <Route index                           element={<AttDashboardPage />} />
              <Route path="events"                   element={<BrowseEventsPage />} />
              <Route path="events/:id"               element={<EventDetailPage />} />
              <Route path="events/:id/exhibitors"    element={<AttExhibitorsPage />} />
              <Route path="floor-plan"               element={<FloorPlanViewerPage />} />
              <Route path="bookings"                 element={<BookingsPage />} />
              <Route path="schedule"                 element={<AttSchedulePage />} />
              <Route path="profile"                  element={<AttProfilePage />} />
              <Route path="messages"                 element={<MessagesPage />} />
              <Route path="notifications"            element={<NotificationsPage />} />
              <Route path="settings"                 element={<SettingsPage />} />
            </Route>

            {/* ── 404 ─────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </>
  )
}
