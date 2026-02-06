// API Base URL
const API_URL = 'https://expense-tracker-application-react.onrender.com/api';

// Authentication functions
async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Invalid email or password');
      }
      if (response.status === 404) {
        throw new Error('Account not found. Please sign up first.');
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    // Network error or other fetch errors
    if (error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please check your internet connection.');
    }
    throw error;
  }
}

async function signup(name, email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Handle specific error cases
      if (response.status === 400 || response.status === 409) {
        throw new Error(error.message || 'An account with this email already exists');
      }
      throw new Error(error.message || 'Signup failed. Please try again.');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    // Network error or other fetch errors
    if (error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please check your internet connection.');
    }
    throw error;
  }
}

async function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let msg = `Failed to get user (status ${response.status})`;
    try {
      const body = await response.json();
      if (body && body.message) msg += `: ${body.message}`;
    } catch (e) {
      // ignore JSON parse
    }
    throw new Error(msg);
  }

  return await response.json();
}

async function changePassword(oldPassword, newPassword) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Password change failed');
  }

  return await response.json();
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
  }
}
