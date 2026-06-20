// ============================================================
// API SERVICE LAYER (REAL INTEGRATION)
// Connects React frontend components to FastAPI Python backend
// ============================================================

const BASE_URL = '/api';

// Helper for HTTP requests
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401 && !endpoint.includes('/auth/login')) {
    // Session expired or invalid token - clear authentication data and redirect to login
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("currentUser");
    
    // Check to avoid redirection loop if already on login page
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin-login')) {
      window.location.href = '/login';
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    let errMsg = `API Error: ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errMsg = errJson.detail;
      }
    } catch (_) {}
    throw new Error(errMsg);
  }

  return res.json();
};

// ── Authentication API ─────────────────────────────────────────
export const authAPI = {
  login: async (credentials) => {
    // credentials: { email, password, role }
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  registerStudent: async (payload) => {
    return request('/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  registerTeacher: async (payload) => {
    return request('/auth/register/teacher', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  forgotPassword: async (email) => {
    return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },
  resetPassword: async (token, password) => {
    return request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
  }
};

// ── Students API ──────────────────────────────────────────────
export const studentAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students${query ? '?' + query : ''}`);
  },
  getById: async (id) => {
    return request(`/students/${id}`);
  },
  create: async (payload) => {
    return request('/students', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  update: async (id, payload) => {
    return request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  delete: async (id) => {
    return request(`/students/${id}`, {
      method: 'DELETE'
    });
  },
  uploadFaceImages: async (id, base64Images) => {
    return request(`/students/${id}/face-images`, {
      method: 'POST',
      body: JSON.stringify({ images: base64Images })
    });
  },
  uploadOwnFaceImages: async (base64Images) => {
    return request('/student/face-images', {
      method: 'POST',
      body: JSON.stringify({ images: base64Images })
    });
  },
};

// ── Teachers API ──────────────────────────────────────────────
export const teacherAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/teachers${query ? '?' + query : ''}`);
  },
  getById: async (id) => {
    return request(`/teachers/${id}`);
  },
  create: async (payload) => {
    return request('/teachers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  update: async (id, payload) => {
    return request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  delete: async (id) => {
    return request(`/teachers/${id}`, {
      method: 'DELETE'
    });
  },
};

// ── Attendance API ────────────────────────────────────────────
export const attendanceAPI = {
  getSessionHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/session-history?${query}`);
  },
  getSessionDetail: async (sessionId) => {
    return request(`/attendance/session-history/${sessionId}`);
  },
  exportExcel: async (date) => {
    return request(`/attendance/export?date=${date}`);
  },
  scanFace: async (base64Image, classCode = null, location = null) => {
    return request('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        image: base64Image,
        classCode,
        latitude: location?.latitude,
        longitude: location?.longitude,
        locationAccuracy: location?.accuracy
      })
    });
  },
  getSessions: async () => {
    return request(`/attendance/sessions?t=${Date.now()}`);
  },
  toggleSession: async (payload) => {
    // payload: { classCode: string, active: boolean }
    return request('/attendance/sessions/toggle', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getStudentAttendance: async () => {
    return request('/student/attendance');
  }
};

// ── Reports API ───────────────────────────────────────────────
export const reportsAPI = {
  getStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/stats${query ? '?' + query : ''}`);
  },
  getSummary: async () => {
    return request('/reports/summary');
  },
  getDepartments: async () => {
    return request('/reports/departments');
  },
  getExportUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem("token");
    return `/api/reports/export?token=${token}&${query}`;
  }
};

// ── Dashboard API ─────────────────────────────────────────────
export const dashboardAPI = {
  getStats: async () => {
    return request('/dashboard/stats');
  },
};

// ── Admin API ─────────────────────────────────────────────────
export const adminAPI = {
  getAuditLogs: async () => {
    return request('/admin/audit-logs');
  }
};
