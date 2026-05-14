import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const DailyReport      = lazy(() => import('./forms/DailyReport'));
const RoutineBacklog   = lazy(() => import('./forms/RoutineBacklog'));
const PostponedBacklog = lazy(() => import('./forms/PostponedBacklog'));
const GoalsMeeting     = lazy(() => import('./forms/GoalsMeeting'));
const Reflection       = lazy(() => import('./forms/Reflection'));
const Week1Review      = lazy(() => import('./forms/Week1Review'));

const PatientList      = lazy(() => import('./coach/PatientList'));
const PatientDashboard = lazy(() => import('./coach/PatientDashboard'));

function Loading() {
  return <div className="spinner">Loading…</div>;
}

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function CoachOnly() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'coach') return <Navigate to="/" replace />;
  return <Outlet />;
}

function PublicOnly() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/forms/daily-report" element={
            <Suspense fallback={<Loading />}><DailyReport /></Suspense>
          } />
          <Route path="/forms/routine-backlog" element={
            <Suspense fallback={<Loading />}><RoutineBacklog /></Suspense>
          } />
          <Route path="/forms/postponed-backlog" element={
            <Suspense fallback={<Loading />}><PostponedBacklog /></Suspense>
          } />
          <Route path="/forms/goals-meeting" element={
            <Suspense fallback={<Loading />}><GoalsMeeting /></Suspense>
          } />
          <Route path="/forms/reflection" element={
            <Suspense fallback={<Loading />}><Reflection /></Suspense>
          } />
          <Route path="/forms/week1-review" element={
            <Suspense fallback={<Loading />}><Week1Review /></Suspense>
          } />
        </Route>
        <Route element={<CoachOnly />}>
          <Route path="/coach/patients" element={
            <Suspense fallback={<Loading />}><PatientList /></Suspense>
          } />
          <Route path="/coach/patients/:id" element={
            <Suspense fallback={<Loading />}><PatientDashboard /></Suspense>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
