// ============================================================
// API SERVICE LAYER (REAL INTEGRATION)
// Connects React frontend components to FastAPI Python backend
// ============================================================

const BASE_URL = '/api';

// Helper for HTTP requests
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { 
    'Content-Type': 'application/json', 
    ...options.headers 
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `API Error: ${res.status}`);
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
  getByDate: async (date) => {
    return request(`/attendance?date=${date}`);
  },
  markManual: async (payload) => {
    // payload: { studentId: int, status: boolean, date: string }
    return request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  exportExcel: async (date) => {
    return request(`/attendance/export?date=${date}`);
  },
  scanFace: async (base64Image) => {
    return request('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image })
    });
  }
};

// ── Reports API ───────────────────────────────────────────────
export const reportsAPI = {
  getSummary: async () => {
    return request('/reports/summary');
  },
};

// ── Dashboard API ─────────────────────────────────────────────
export const dashboardAPI = {
  getStats: async () => {
    return request('/dashboard/stats');
  },
};
