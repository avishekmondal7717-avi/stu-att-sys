import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { attendanceAPI } from './services/api';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import TeacherRegister from './pages/teacher/Register';
import AdminLogin from "./pages/AdminLogin";
import Dashboard from './pages/teacher/Dashboard';
import StudentList from './pages/teacher/StudentList';
import AddStudent from './pages/teacher/AddStudent';
import AttendanceTable from './pages/teacher/AttendanceTable';
import MarkAttendance from './pages/teacher/MarkAttendance';
import Reports from './pages/teacher/Reports';
import Webcam from './pages/teacher/Webcam';
import Settings from './pages/teacher/Settings';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSidebar from './components/StudentSidebar';
import StudentWebcam from './pages/student/StudentWebcam';
import StudentLogs from './pages/student/StudentLogs';
import StudentProfile from './pages/student/StudentProfile';
import AdminSidebar from './components/AdminSidebar';
import AdminDashboard from './pages/admin/Dashboard';
import AdminManageStudents from './pages/admin/ManageStudents';
import AdminManageTeachers from './pages/admin/ManageTeachers';
import AdminAnalytics from './pages/admin/FullAnalytics';
import AdminSettings from './pages/admin/SystemSettings';
import './App.css';


// Initial student attendance logs
const initialStudentLogs = [
  { key: '1', date: '2026-06-16', timeIn: '09:15:30 AM', timeOut: '04:45:10 PM', status: 'Present', type: 'Webcam Face ID' },
  { key: '2', date: '2026-06-15', timeIn: '09:10:05 AM', timeOut: '04:40:00 PM', status: 'Present', type: 'Webcam Face ID' },
  { key: '3', date: '2026-06-14', timeIn: '-', timeOut: '-', status: 'Absent', type: '-' },
  { key: '4', date: '2026-06-13', timeIn: '09:08:22 AM', timeOut: '04:38:15 PM', status: 'Present', type: 'Webcam Face ID' },
  { key: '5', date: '2026-06-12', timeIn: '09:12:40 AM', timeOut: '04:43:00 PM', status: 'Present', type: 'Webcam Face ID' },
  { key: '6', date: '2026-06-11', timeIn: '09:14:15 AM', timeOut: '04:45:00 PM', status: 'Present', type: 'Manual Mark' },
  { key: '7', date: '2026-06-10', timeIn: '-', timeOut: '-', status: 'Absent', type: '-' },
];

function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar />
      <div className="main-area">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Shared state for student attendance
  const [logs, setLogs] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);

  const fetchStudentData = async () => {
    try {
      const res = await attendanceAPI.getStudentAttendance();
      const fetchedLogs = res.data || [];
      setLogs(fetchedLogs);
      
      const present = fetchedLogs.filter(l => l.status === 'Present').length;
      const absent = fetchedLogs.filter(l => l.status === 'Absent').length;
      setPresentCount(present);
      setAbsentCount(absent);
      setTotalClasses(present + absent);
    } catch (err) {
      console.error("Failed to fetch student attendance data:", err);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <StudentSidebar />
      <div className="main-area">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <main className="page-content">
          <Outlet context={{ logs, setLogs, presentCount, setPresentCount, absentCount, totalClasses, setTotalClasses, fetchStudentData }} />
        </main>
      </div>
    </div>
  );
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <AdminSidebar />
      <div className="main-area">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");

  if (!token || !email || !role) {
    return <Navigate to="/login" replace />;
  }

  const decoded = parseJwt(token);
  if (!decoded) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("currentUser");
    return <Navigate to="/login" replace />;
  }

  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("currentUser");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    if (role === "teacher") return <Navigate to="/dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function HomeRedirect() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  if (token && role) {
    const decoded = parseJwt(token);
    if (decoded && decoded.exp * 1000 > Date.now()) {
      if (role === "student") return <Navigate to="/student/dashboard" replace />;
      if (role === "teacher") return <Navigate to="/dashboard" replace />;
      if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    }
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher/register" element={<TeacherRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route element={<StudentLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/webcam" element={<StudentWebcam />} />
            <Route path="/student/logs" element={<StudentLogs />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route element={<TeacherLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/students/list" element={<StudentList />} />
            <Route path="/add-student" element={<AddStudent />} />
            <Route path="/students/add" element={<AddStudent />} />
            <Route path="/students/edit/:id" element={<AddStudent />} />
            <Route path="/attendance" element={<AttendanceTable />} />
            <Route path="/attendance/table" element={<AttendanceTable />} />
            <Route path="/attendance/mark" element={<MarkAttendance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/webcam" element={<Webcam />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminManageStudents />} />
            <Route path="/admin/teachers" element={<AdminManageTeachers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}