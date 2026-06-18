import { App as AntdApp, notification } from 'antd';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${theme}`}>
      <Sidebar theme={theme} />
      <div className="main-area">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} theme={theme} setTheme={setTheme} />
        <main className="page-content">
          <Outlet context={{ theme, setTheme }} />
        </main>
      </div>
    </div>
  );
}

function StudentLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  // Shared state for student attendance
  const [logs, setLogs] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [activeSessions, setActiveSessions] = useState([]);
  
  // Keep track of sessions we already triggered notifications for
  const notifiedSessions = useRef(new Set());

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  // Poll active sessions globally for notifications and sharing with children
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await attendanceAPI.getSessions();
        const active = (res.sessions || []).filter(s => s.isActive);
        
        // Find newly active sessions
        active.forEach(session => {
          if (!notifiedSessions.current.has(session.classCode)) {
            // Trigger Ant Design Notification toast
            notification.info({
              message: 'Class Attendance Live!',
              description: `The attendance window for ${session.className} is now open. Click here to mark your attendance.`,
              duration: 15,
              placement: 'topRight',
              style: { cursor: 'pointer', borderLeft: '4px solid #10b981' },
              onClick: () => {
                navigate(`/student/webcam?class=${session.classCode}`);
                notification.destroy();
              }
            });
            notifiedSessions.current.add(session.classCode);
          }
        });

        // Clean up from notified sessions if they are no longer active
        const activeCodes = new Set(active.map(s => s.classCode));
        notifiedSessions.current.forEach(code => {
          if (!activeCodes.has(code)) {
            notifiedSessions.current.delete(code);
          }
        });

        setActiveSessions(active);
      } catch (err) {
        console.error("Error fetching sessions in Layout:", err);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 4000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${theme}`}>
      <StudentSidebar theme={theme} />
      <div className="main-area">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} theme={theme} setTheme={setTheme} />
        <main className="page-content">
          <Outlet context={{ 
            logs, 
            setLogs, 
            presentCount, 
            setPresentCount, 
            absentCount, 
            totalClasses, 
            setTotalClasses, 
            fetchStudentData, 
            activeSessions, 
            theme, 
            setTheme 
          }} />
        </main>
      </div>
    </div>
  );
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${theme}`}>
      <AdminSidebar theme={theme} />
      <div className="main-area">
        <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} theme={theme} setTheme={setTheme} />
        <main className="page-content">
          <Outlet context={{ theme, setTheme }} />
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
    <AntdApp>
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
    </AntdApp>
  );
}