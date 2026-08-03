import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BankSoal from './pages/admin/BankSoal';
import ImportCsv from './pages/admin/ImportCsv';
import Practice from './pages/student/Practice';
import ExamSession from './pages/student/ExamSession';
import ExamResult from './pages/student/ExamResult';
import ExamHistory from './pages/student/ExamHistory';
import Performance from './pages/student/Performance';
import Bookmarks from './pages/student/Bookmarks';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student routes - protected and role-restricted */}
      <Route element={<ProtectedRoute allowedRoles={[ 'student' ]} unauthenticatedElement={<Navigate to="/login" replace />} /> }>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/latihan" element={<Practice />} />
        <Route path="/student/latihan/:sessionId" element={<ExamSession />} />
        <Route path="/student/hasil/:sessionId" element={<ExamResult />} />
        <Route path="/student/riwayat" element={<ExamHistory />} />
        <Route path="/student/performa" element={<Performance />} />
        <Route path="/student/bookmark" element={<Bookmarks />} />
      </Route>

      {/* Admin routes - protected and role-restricted */}
      <Route element={<ProtectedRoute allowedRoles={[ 'admin' ]} unauthenticatedElement={<Navigate to="/login" replace />} /> }>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/bank-soal" element={<BankSoal />} />
        <Route path="/admin/import" element={<ImportCsv />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App