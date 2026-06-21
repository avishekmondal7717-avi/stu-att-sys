// ============================================================
// DUMMY DATA — Replace these with real API calls in services/api.js
// ============================================================

export const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Automobile Engineering',
  'Computer Science (AI & ML)',
];

export const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc'];

export const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const students = [
  { id: 1, rollNumber: 'CS2024001', fullName: 'Aarav Sharma', email: 'aarav.sharma@email.com', contact: '9876543210', department: 'Computer Science', course: 'B.Tech', semester: '4', gender: 'Male', dob: '2003-04-15', status: 'Active' },
  { id: 2, rollNumber: 'CS2024002', fullName: 'Priya Singh', email: 'priya.singh@email.com', contact: '9876543211', department: 'Computer Science', course: 'B.Tech', semester: '4', gender: 'Female', dob: '2003-07-22', status: 'Active' },
  { id: 3, rollNumber: 'IT2024001', fullName: 'Rahul Verma', email: 'rahul.verma@email.com', contact: '9876543212', department: 'Information Technology', course: 'B.Tech', semester: '4', gender: 'Male', dob: '2003-01-10', status: 'Active' },
  { id: 4, rollNumber: 'EC2024003', fullName: 'Anjali Kumari', email: 'anjali.kumari@email.com', contact: '9876543213', department: 'Electronics & Communication', course: 'B.Tech', semester: '4', gender: 'Female', dob: '2003-09-05', status: 'Active' },
  { id: 5, rollNumber: 'ME2024002', fullName: 'Rohit Yadav', email: 'rohit.yadav@email.com', contact: '9876543214', department: 'Mechanical Engineering', course: 'B.Tech', semester: '4', gender: 'Male', dob: '2002-12-30', status: 'Active' },
  { id: 6, rollNumber: 'CS2024003', fullName: 'Neha Patel', email: 'neha.patel@email.com', contact: '9876543215', department: 'Computer Science', course: 'B.Tech', semester: '2', gender: 'Female', dob: '2004-03-18', status: 'Active' },
  { id: 7, rollNumber: 'CE2024001', fullName: 'Vikash Kumar', email: 'vikash.kumar@email.com', contact: '9876543216', department: 'Civil Engineering', course: 'B.Tech', semester: '2', gender: 'Male', dob: '2004-06-25', status: 'Active' },
  { id: 8, rollNumber: 'IT2024002', fullName: 'Sneha Rathi', email: 'sneha.rathi@email.com', contact: '9876543217', department: 'Information Technology', course: 'B.Tech', semester: '2', gender: 'Female', dob: '2004-08-12', status: 'Active' },
  { id: 9, rollNumber: 'EE2024001', fullName: 'Manish Gupta', email: 'manish.gupta@email.com', contact: '9876543218', department: 'Electrical Engineering', course: 'B.Tech', semester: '2', gender: 'Male', dob: '2004-02-08', status: 'Active' },
  { id: 10, rollNumber: 'CS2024004', fullName: 'Karan Mehta', email: 'karan.mehta@email.com', contact: '9876543219', department: 'Computer Science', course: 'B.Tech', semester: '6', gender: 'Male', dob: '2002-11-20', status: 'Active' },
  { id: 11, rollNumber: 'ME2024003', fullName: 'Pooja Tiwari', email: 'pooja.tiwari@email.com', contact: '9876543220', department: 'Mechanical Engineering', course: 'B.Tech', semester: '6', gender: 'Female', dob: '2002-05-14', status: 'Inactive' },
  { id: 12, rollNumber: 'IT2024003', fullName: 'Arjun Mishra', email: 'arjun.mishra@email.com', contact: '9876543221', department: 'Information Technology', course: 'B.Tech', semester: '6', gender: 'Male', dob: '2002-07-30', status: 'Active' },
];

export const attendanceRecords = [
  { id: 1, rollNumber: 'CS2024001', studentName: 'Aarav Sharma', department: 'Computer Science', date: '2024-05-16', timeIn: '09:15:30 AM', timeOut: '04:45:10 PM', status: 'Present', markedBy: 'Webcam' },
  { id: 2, rollNumber: 'CS2024002', studentName: 'Priya Singh', department: 'Computer Science', date: '2024-05-16', timeIn: '09:14:22 AM', timeOut: '04:40:05 PM', status: 'Present', markedBy: 'Webcam' },
  { id: 3, rollNumber: 'IT2024001', studentName: 'Rahul Verma', department: 'Information Technology', date: '2024-05-16', timeIn: '09:16:10 AM', timeOut: '04:50:20 PM', status: 'Present', markedBy: 'Webcam' },
  { id: 4, rollNumber: 'EC2024003', studentName: 'Anjali Kumari', department: 'Electronics & Comm.', date: '2024-05-16', timeIn: '09:13:45 AM', timeOut: '04:42:30 PM', status: 'Present', markedBy: 'Webcam' },
  { id: 5, rollNumber: 'ME2024002', studentName: 'Rohit Yadav', department: 'Mechanical Engineering', date: '2024-05-16', timeIn: '-', timeOut: '-', status: 'Absent', markedBy: '-' },
  { id: 6, rollNumber: 'CS2024003', studentName: 'Neha Patel', department: 'Computer Science', date: '2024-05-16', timeIn: '09:17:05 AM', timeOut: '04:48:15 PM', status: 'Present', markedBy: 'Webcam' },
  { id: 7, rollNumber: 'CE2024001', studentName: 'Vikash Kumar', department: 'Civil Engineering', date: '2024-05-16', timeIn: '-', timeOut: '-', status: 'Absent', markedBy: '-' },
  { id: 8, rollNumber: 'IT2024002', studentName: 'Sneha Rathi', department: 'Information Technology', date: '2024-05-16', timeIn: '09:18:40 AM', timeOut: '04:51:00 PM', status: 'Present', markedBy: 'Webcam' },
  { id: 9, rollNumber: 'EE2024001', studentName: 'Manish Gupta', department: 'Electrical Engineering', date: '2024-05-16', timeIn: '-', timeOut: '-', status: 'Absent', markedBy: '-' },
  { id: 10, rollNumber: 'CS2024004', studentName: 'Karan Mehta', department: 'Computer Science', date: '2024-05-16', timeIn: '09:15:00 AM', timeOut: '04:47:25 PM', status: 'Present', markedBy: 'Webcam' },
];

export const departmentStats = [
  { name: 'Computer Science', totalStudents: 45, present: 1562, absent: 362, percentage: 81.2 },
  { name: 'Information Technology', totalStudents: 35, present: 1050, absent: 358, percentage: 74.6 },
  { name: 'Electronics & Communication', totalStudents: 28, present: 606, absent: 236, percentage: 72.1 },
  { name: 'Mechanical Engineering', totalStudents: 25, present: 444, absent: 181, percentage: 71.0 },
  { name: 'Civil Engineering', totalStudents: 17, present: 236, absent: 110, percentage: 68.3 },
];

export const attendanceOverview = [
  { date: 'May 1', value: 72 },
  { date: 'May 6', value: 78 },
  { date: 'May 11', value: 74 },
  { date: 'May 16', value: 82 },
  { date: 'May 21', value: 80 },
  { date: 'May 26', value: 62 },
  { date: 'May 31', value: 76 },
];

export const dashboardStats = {
  totalStudents: 150,
  totalPresent: 120,
  totalAbsent: 30,
  attendanceRate: 80,
  recentAttendance: attendanceRecords.slice(0, 5),
};

export const DEPT_COLORS = {
  'Computer Science': '#3b82f6',
  'Information Technology': '#22c55e',
  'Electronics & Communication': '#f59e0b',
  'Mechanical Engineering': '#8b5cf6',
  'Civil Engineering': '#06b6d4',
  'Electrical Engineering': '#ef4444',
};
