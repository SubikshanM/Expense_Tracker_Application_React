// Check authentication on page load
checkAuth();

// Global state
let expenses = [];
let darkMode = false;
let selectedCategory = 'All';
let currentEditingId = null;
let user = null;

// API_URL is already defined in auth.js

// Categories with icons
const CATEGORIES = [
  { value: 'Food', label: 'Food & Dining', icon: '🍕' },
  { value: 'Transportation', label: 'Transportation', icon: '🚗' },
  { value: 'Entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'Bills', label: 'Bills & Utilities', icon: '💡' },
  { value: 'Healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'Shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Salary', label: 'Salary', icon: '💼' },
  { value: 'Investment', label: 'Investment', icon: '📈' },
  { value: 'Other', label: 'Other', icon: '📦' },
];

// Chart instances
let lineChart, barChart, doughnutChart, pieChart;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  await loadExpenses();
  initializeEventListeners();
  renderCategoryFilters();
  setTodayDate();
});

// Load current user
async function loadUser() {
  try {
    let u = await getCurrentUser();

    // Backend may wrap user in { user: {...} } or { data: {...} }
    if (u && u.user) u = u.user;
    if (u && u.data) u = u.data;

    // Validate user data exists
    if (!u || !u.name || !u.email) {
      console.error('Invalid user payload from /auth/me:', u);
      throw new Error('Invalid user data');
    }

    user = u;

    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('profile-avatar').textContent = initials;
    document.getElementById('profile-avatar-large').textContent = initials;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
  } catch (error) {
    console.error('Failed to load user:', error);
    // Only logout if it's an auth error, not network error
    if (error.message.includes('401') || error.message.includes('token')) {
      logout();
    } else {
      alert('Failed to load user data. Backend may be deploying. Please refresh.');
    }
  }
}

// Load expenses from API
async function loadExpenses() {
  try {
    const token = localStorage.getItem('token');
    
    // Add 90 second timeout for backend wake-up
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    const response = await fetch(`${API_URL}/expenses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // read server body for diagnostics
      let bodyText = '';
      try {
        const json = await response.json();
        bodyText = json.message || JSON.stringify(json);
      } catch (e) {
        try { bodyText = await response.text(); } catch (e2) { bodyText = ''; }
      }
      console.error(`Expenses fetch failed: status=${response.status} body=${bodyText}`);
      if (response.status === 401) {
        // Only logout if unauthorized
        alert('Session expired. Please login again.');
        logout();
        return;
      }
      throw new Error(`Failed to load expenses (status ${response.status})`);
    }

    const data = await response.json();
    // Normalize expenses array and coerce numeric fields
    const raw = Array.isArray(data.expenses) ? data.expenses : (data.data || data.items || []);
    expenses = raw.map(e => ({
      id: e.id,
      date: e.date,
      income: Number(e.income) || 0,
      expense: Number(e.expense) || 0,
      category: e.category || 'Other',
      description: e.description || ''
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    renderExpenses();
    updateSummary();
    renderCharts();
  } catch (error) {
    console.error('Error loading expenses:', error);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    
    if (error.name === 'AbortError') {
      alert('Backend is waking up (free tier takes 50-60 seconds). Please wait 30 seconds and refresh the page.');
    } else {
      alert('Failed to load expenses. Backend may still be deploying or returned an error. Check console for details.');
    }
    
    // Show empty dashboard
    renderExpenses();
    updateSummary();
  }
}

// Add new expense
async function addExpense(expenseData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) throw new Error('Failed to add expense');

    await loadExpenses();
  } catch (error) {
    console.error('Error adding expense:', error);
    alert('Failed to add expense');
  }
}

// Update expense
async function updateExpense(id, expenseData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) throw new Error('Failed to update expense');

    await loadExpenses();
  } catch (error) {
    console.error('Error updating expense:', error);
    alert('Failed to update expense');
  }
}

// Delete expense
async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to delete expense');

    await loadExpenses();
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('Failed to delete expense');
  }
}

// Render expenses table
function renderExpenses() {
  const tbody = document.getElementById('expenses-table');
  tbody.innerHTML = '';

  const filteredExpenses = selectedCategory === 'All' 
    ? expenses 
    : expenses.filter(e => e.category === selectedCategory);

  let runningBalance = 0;

  filteredExpenses.forEach(entry => {
    runningBalance += (entry.income || 0) - (entry.expense || 0);
    
    const row = document.createElement('tr');
    const categoryInfo = CATEGORIES.find(c => c.value === entry.category) || CATEGORIES.find(c => c.value === 'Other');
    
    row.innerHTML = `
      <td>${new Date(entry.date).toLocaleDateString('en-IN')}</td>
      <td class="income-cell">${entry.income ? '₹' + entry.income.toFixed(2) : '-'}</td>
      <td class="expense-cell">${entry.expense ? '₹' + entry.expense.toFixed(2) : '-'}</td>
      <td class="balance-cell">₹${runningBalance.toFixed(2)}</td>
      <td class="category-cell">
        <span class="category-badge">${categoryInfo.icon} ${categoryInfo.label}</span>
      </td>
      <td class="description-cell">${entry.description || '-'}</td>
      <td class="action-cell">
        <button class="edit-btn" onclick="openEditModal(${entry.id})">✏️</button>
        <button class="delete-btn" onclick="deleteExpense(${entry.id})">🗑️</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Update summary cards
function updateSummary() {
  const totalIncome = expenses.reduce((sum, e) => sum + (e.income || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + (e.expense || 0), 0);
  const balance = totalIncome - totalExpense;

  document.getElementById('total-income').textContent = '₹' + totalIncome.toFixed(2);
  document.getElementById('total-expense').textContent = '₹' + totalExpense.toFixed(2);
  document.getElementById('balance').textContent = '₹' + balance.toFixed(2);
  document.getElementById('total-count').textContent = expenses.length;
}

// Render category filters
function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  container.innerHTML = '';

  // Add "All" filter
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = '📋 All';
  allBtn.onclick = () => filterByCategory('All');
  container.appendChild(allBtn);

  // Add category filters
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = `${cat.icon} ${cat.label}`;
    btn.onclick = () => filterByCategory(cat.value);
    container.appendChild(btn);
  });
}

// Filter by category
function filterByCategory(category) {
  selectedCategory = category;
  
  // Update active state
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  renderExpenses();
  renderCharts();
}

// Render charts
function renderCharts() {
  renderLineChart();
  renderBarChart();
  renderDoughnutChart();
  renderPieChart();
}

// Line Chart - Income vs Expense Trend
function renderLineChart() {
  const ctx = document.getElementById('lineChart').getContext('2d');
  
  const dates = expenses.map(e => new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  const incomes = expenses.map(e => e.income || 0);
  const expensesList = expenses.map(e => e.expense || 0);
  
  if (lineChart) lineChart.destroy();
  
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          borderColor: '#11998e',
          backgroundColor: 'rgba(17, 153, 142, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expense',
          data: expensesList,
          borderColor: '#eb3349',
          backgroundColor: 'rgba(235, 51, 73, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      animation: {
        duration: 1500,
      },
    },
  });
}

// Bar Chart - Monthly Comparison
function renderBarChart() {
  const ctx = document.getElementById('barChart').getContext('2d');
  
  // Group by month
  const monthlyData = {};
  expenses.forEach(e => {
    const month = new Date(e.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0 };
    }
    monthlyData[month].income += e.income || 0;
    monthlyData[month].expense += e.expense || 0;
  });
  
  const months = Object.keys(monthlyData);
  const incomes = months.map(m => monthlyData[m].income);
  const expensesList = months.map(m => monthlyData[m].expense);
  
  if (barChart) barChart.destroy();
  
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          backgroundColor: '#11998e',
        },
        {
          label: 'Expense',
          data: expensesList,
          backgroundColor: '#eb3349',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      animation: {
        duration: 1500,
      },
    },
  });
}

// Doughnut Chart - Expense Breakdown
function renderDoughnutChart() {
  const ctx = document.getElementById('doughnutChart').getContext('2d');
  
  const categoryTotals = {};
  expenses.filter(e => e.expense > 0).forEach(e => {
    if (!categoryTotals[e.category]) {
      categoryTotals[e.category] = 0;
    }
    categoryTotals[e.category] += e.expense;
  });
  
  const labels = Object.keys(categoryTotals).map(cat => {
    const catInfo = CATEGORIES.find(c => c.value === cat);
    return catInfo ? `${catInfo.icon} ${catInfo.label}` : cat;
  });
  const data = Object.values(categoryTotals);
  
  if (doughnutChart) doughnutChart.destroy();
  
  doughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#667eea', '#764ba2', '#11998e', '#eb3349',
          '#f45c43', '#4facfe', '#fa709a', '#fee140',
          '#38ef7d', '#00f2fe',
        ],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
      },
      animation: {
        duration: 1500,
      },
    },
  });
}

// Pie Chart - Category Distribution
function renderPieChart() {
  const ctx = document.getElementById('pieChart').getContext('2d');
  
  const categoryTotals = {};
  expenses.forEach(e => {
    if (!categoryTotals[e.category]) {
      categoryTotals[e.category] = 0;
    }
    categoryTotals[e.category] += (e.income || 0) + (e.expense || 0);
  });
  
  const labels = Object.keys(categoryTotals).map(cat => {
    const catInfo = CATEGORIES.find(c => c.value === cat);
    return catInfo ? `${catInfo.icon} ${catInfo.label}` : cat;
  });
  const data = Object.values(categoryTotals);
  
  if (pieChart) pieChart.destroy();
  
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#667eea', '#764ba2', '#11998e', '#eb3349',
          '#f45c43', '#4facfe', '#fa709a', '#fee140',
          '#38ef7d', '#00f2fe',
        ],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
      },
      animation: {
        duration: 1500,
      },
    },
  });
}

// Open edit modal
function openEditModal(id) {
  const entry = expenses.find(e => e.id === id);
  if (!entry) return;
  
  currentEditingId = id;
  document.getElementById('edit-date').value = entry.date;
  document.getElementById('edit-income').value = entry.income || '';
  document.getElementById('edit-expense').value = entry.expense || '';
  document.getElementById('edit-category').value = entry.category;
  document.getElementById('edit-description').value = entry.description || '';
  
  document.getElementById('edit-modal').style.display = 'flex';
}

// Close edit modal
function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
  currentEditingId = null;
}

// Save edited entry
async function saveEdit() {
  const date = document.getElementById('edit-date').value;
  const income = parseFloat(document.getElementById('edit-income').value) || 0;
  const expense = parseFloat(document.getElementById('edit-expense').value) || 0;
  const category = document.getElementById('edit-category').value;
  const description = document.getElementById('edit-description').value;
  
  if (!date) {
    alert('Please select a date');
    return;
  }
  
  await updateExpense(currentEditingId, {
    date,
    income,
    expense,
    category,
    description,
  });
  
  closeEditModal();
}

// Set today's date as default
function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
}

// Toggle theme
function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  document.getElementById('theme-toggle').textContent = darkMode ? '☀️' : '🌙';
}

// Toggle profile menu
function toggleProfileMenu() {
  const menu = document.getElementById('profile-menu');
  menu.classList.toggle('show');
}

// Open password modal
function openPasswordModal() {
  document.getElementById('password-modal').style.display = 'flex';
  toggleProfileMenu();
}

// Close password modal
function closePasswordModal() {
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('old-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

// Save new password
async function savePassword() {
  const oldPassword = document.getElementById('old-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  if (!oldPassword || !newPassword || !confirmPassword) {
    alert('Please fill in all fields');
    return;
  }
  
  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert('New passwords do not match');
    return;
  }
  
  try {
    await changePassword(oldPassword, newPassword);
    alert('Password changed successfully');
    closePasswordModal();
  } catch (error) {
    alert(error.message || 'Failed to change password');
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Add entry form
  document.getElementById('add-entry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const income = parseFloat(document.getElementById('income').value) || 0;
    const expense = parseFloat(document.getElementById('expense').value) || 0;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    
    if (!date) {
      alert('Please select a date');
      return;
    }
    
    await addExpense({ date, income, expense, category, description });
    
    // Reset form
    document.getElementById('income').value = '';
    document.getElementById('expense').value = '';
    document.getElementById('category').value = 'Other';
    document.getElementById('description').value = '';
    setTodayDate();
  });
  
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // Profile menu
  document.getElementById('profile-btn').addEventListener('click', toggleProfileMenu);
  
  // Close profile menu when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.profile-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      document.getElementById('profile-menu').classList.remove('show');
    }
  });
  
  // Logout
  document.getElementById('logout-btn').addEventListener('click', logout);
  
  // Change password
  document.getElementById('change-password-btn').addEventListener('click', openPasswordModal);
  
  // Edit modal
  document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
  document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
  document.getElementById('save-edit-btn').addEventListener('click', saveEdit);
  
  // Password modal
  document.getElementById('close-password-modal').addEventListener('click', closePasswordModal);
  document.getElementById('cancel-password-btn').addEventListener('click', closePasswordModal);
  document.getElementById('save-password-btn').addEventListener('click', savePassword);
  
  // Close modals when clicking outside
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') closeEditModal();
  });
  
  document.getElementById('password-modal').addEventListener('click', (e) => {
    if (e.target.id === 'password-modal') closePasswordModal();
  });
}
