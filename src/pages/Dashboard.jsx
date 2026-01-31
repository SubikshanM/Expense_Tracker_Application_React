import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Bar, Line, Doughnut, Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/auth";
import { expenseAPI } from "../api/expenses";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Category options with icons
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

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState("");
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await expenseAPI.getAll();
      const sortedExpenses = data.expenses.sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      setEntries(sortedExpenses);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!date) return;

    try {
      const newEntryData = {
        date,
        income: income ? parseFloat(income) : 0,
        expense: expense ? parseFloat(expense) : 0,
        category,
        description: description || null,
      };

      const data = await expenseAPI.add(newEntryData);
      const updatedEntries = [...entries, data.expense];
      updatedEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEntries(updatedEntries);

      setIncome("");
      setExpense("");
      setDate("");
      setCategory("Other");
      setDescription("");
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await expenseAPI.delete(id);
      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
  };

  const getCategoryIcon = (categoryValue) => {
    const category = CATEGORIES.find(c => c.value === categoryValue);
    return category ? category.icon : '📦';
  };

  const getFilteredEntries = () => {
    if (selectedCategory === 'All') return entries;
    return entries.filter(e => e.category === selectedCategory);
  };

  const getCategoryBreakdown = () => {
    const breakdown = {};
    entries.forEach(e => {
      const cat = e.category || 'Other';
      if (!breakdown[cat]) {
        breakdown[cat] = { income: 0, expense: 0 };
      }
      breakdown[cat].income += parseFloat(e.income) || 0;
      breakdown[cat].expense += parseFloat(e.expense) || 0;
    });
    return breakdown;
  };

  const getSummary = () => {
    const filtered = getFilteredEntries();
    const totalIncome = filtered.reduce((sum, e) => sum + (parseFloat(e.income) || 0), 0);
    const totalExpense = filtered.reduce((sum, e) => sum + (parseFloat(e.expense) || 0), 0);
    const balance = totalIncome - totalExpense;
    return { 
      totalIncome: Number(totalIncome.toFixed(2)), 
      totalExpense: Number(totalExpense.toFixed(2)), 
      balance: Number(balance.toFixed(2)), 
      count: filtered.length 
    };
  };

  const groupByMonth = () => {
    const groups = {};
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;

    const filtered = getFilteredEntries();
    filtered.forEach((e) => {
      const month = new Date(e.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!groups[month]) groups[month] = [];

      cumulativeIncome += (parseFloat(e.income) || 0);
      cumulativeExpense += (parseFloat(e.expense) || 0);

      groups[month].push({
        ...e,
        income: parseFloat(e.income) || 0,
        expense: parseFloat(e.expense) || 0,
        balance: cumulativeIncome - cumulativeExpense,
      });
    });

    return groups;
  };

  const chartData = () => {
    const months = Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString("default", { month: "short" })
    );

    const incomeData = Array(12).fill(0);
    const expenseData = Array(12).fill(0);

    entries.forEach((e) => {
      const monthIdx = new Date(e.date).getMonth();
      incomeData[monthIdx] += (parseFloat(e.income) || 0);
      expenseData[monthIdx] += (parseFloat(e.expense) || 0);
    });

    return { months, incomeData, expenseData };
  };

  const getComparisonChartData = () => {
    const { months, incomeData, expenseData } = chartData();
    return {
      labels: months,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          borderColor: "rgba(76, 175, 80, 1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Expense",
          data: expenseData,
          backgroundColor: "rgba(244, 67, 54, 0.2)",
          borderColor: "rgba(244, 67, 54, 1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getBarChartData = () => {
    const { months, incomeData, expenseData } = chartData();
    return {
      labels: months,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          backgroundColor: "rgba(76, 175, 80, 0.8)",
          borderRadius: 8,
        },
        {
          label: "Expense",
          data: expenseData,
          backgroundColor: "rgba(244, 67, 54, 0.8)",
          borderRadius: 8,
        },
      ],
    };
  };

  const getPieChartData = () => {
    const summary = getSummary();
    return {
      labels: ['Income', 'Expense'],
      datasets: [
        {
          label: 'Total Amount',
          data: [summary.totalIncome, summary.totalExpense],
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(244, 67, 54, 0.8)',
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(244, 67, 54, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getSavingsChartData = () => {
    const { months, incomeData, expenseData } = chartData();
    const savingsData = incomeData.map((income, idx) => income - expenseData[idx]);
    
    return {
      labels: months,
      datasets: [
        {
          label: "Monthly Savings",
          data: savingsData,
          backgroundColor: savingsData.map(val => 
            val >= 0 ? "rgba(76, 175, 80, 0.8)" : "rgba(244, 67, 54, 0.8)"
          ),
          borderRadius: 8,
        },
      ],
    };
  };

  const getCategoryChartData = () => {
    const breakdown = getCategoryBreakdown();
    const categories = Object.keys(breakdown);
    const expenseData = categories.map(cat => breakdown[cat].expense);
    
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(255, 99, 255, 0.8)',
      'rgba(99, 255, 132, 0.8)',
    ];

    return {
      labels: categories.map(cat => getCategoryIcon(cat) + ' ' + cat),
      datasets: [
        {
          label: 'Expense by Category',
          data: expenseData,
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 12,
            weight: '600',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ₹' + context.parsed.y.toFixed(2);
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value;
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 13,
            weight: '600',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return label + ': ₹' + value.toFixed(2) + ' (' + percentage + '%)';
          }
        }
      },
    },
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your expenses...</p>
      </div>
    );
  }

  const summary = getSummary();

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <header>
        <div className="header-content">
          <div>
            <h1>💰 Expense Tracker</h1>
            <p className="header-subtitle">Manage your finances smartly</p>
          </div>
          <div className="header-controls">
            <span className="user-badge">👤 {user?.email}</span>
            <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <p className="card-label">Total Income</p>
            <h3 className="card-value">₹{summary.totalIncome.toFixed(2)}</h3>
          </div>
        </div>
        <div className="summary-card expense-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <p className="card-label">Total Expense</p>
            <h3 className="card-value">₹{summary.totalExpense.toFixed(2)}</h3>
          </div>
        </div>
        <div className="summary-card balance-card">
          <div className="card-icon">{summary.balance >= 0 ? '💰' : '⚠️'}</div>
          <div className="card-content">
            <p className="card-label">Balance</p>
            <h3 className="card-value" style={{ color: summary.balance >= 0 ? '#4CAF50' : '#f44336' }}>
              ₹{summary.balance.toFixed(2)}
            </h3>
          </div>
        </div>
        <div className="summary-card count-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <p className="card-label">Total Entries</p>
            <h3 className="card-value">{summary.count}</h3>
          </div>
        </div>
      </div>

      {/* Add Entry Form */}
      <div className="add-entry-section">
        <h2 className="section-title">➕ Add New Entry</h2>
        <div className="controls">
          <div className="input-group">
            <label>Date</label>
            <input
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category-select"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Income (₹)</label>
            <input
              type="number"
              placeholder="0.00"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="input-group">
            <label>Expense (₹)</label>
            <input
              type="number"
              placeholder="0.00"
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="input-group input-group-full">
            <label>Description (Optional)</label>
            <input
              type="text"
              placeholder="Enter description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={handleAddEntry} disabled={!date}>
            <span>➕</span> Add Entry
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <h3>🏷️ Filter by Category:</h3>
        <div className="category-filters">
          <button
            className={`filter-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`filter-btn ${selectedCategory === cat.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="actions-bar">
        <button className="download-btn" onClick={handleDownloadExcel}>
          📥 Download Excel
        </button>
      </div>

      {/* Monthly Breakdown */}
      <div className="monthly-section">
        <h2 className="section-title">📅 Monthly Breakdown</h2>
        {Object.entries(groupByMonth()).map(([month, records]) => {
          const totalIncome = records.reduce((sum, r) => sum + (r.income || 0), 0);
          const totalExpense = records.reduce((sum, r) => sum + (r.expense || 0), 0);
          const monthBalance = totalIncome - totalExpense;

          return (
            <div key={month} className="month-group">
              <div className="month-header">
                <h3>📆 {month}</h3>
                <div className="month-summary">
                  <span className="month-income">💵 ₹{totalIncome.toFixed(2)}</span>
                  <span className="month-expense">💸 ₹{totalExpense.toFixed(2)}</span>
                  <span className="month-balance" style={{ color: monthBalance >= 0 ? '#4CAF50' : '#f44336' }}>
                    {monthBalance >= 0 ? '✅' : '⚠️'} ₹{monthBalance.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>📅 Date</th>
                      <th>🏷️ Category</th>
                      <th>📝 Description</th>
                      <th>💵 Income</th>
                      <th>💸 Expense</th>
                      <th>💰 Balance</th>
                      <th>🗑️ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((e, idx) => (
                      <tr key={idx}>
                        <td>{new Date(e.date).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}</td>
                        <td className="category-cell">
                          <span className="category-badge">
                            {getCategoryIcon(e.category)} {e.category || 'Other'}
                          </span>
                        </td>
                        <td className="description-cell">{e.description || '-'}</td>
                        <td className="income-cell">₹{(e.income || 0).toFixed(2)}</td>
                        <td className="expense-cell">₹{(e.expense || 0).toFixed(2)}</td>
                        <td className="balance-cell" style={{ 
                          color: e.balance >= 0 ? '#4CAF50' : '#f44336',
                          fontWeight: '600'
                        }}>
                          ₹{(e.balance || 0).toFixed(2)}
                        </td>
                        <td className="action-cell">
                          <button 
                            className="delete-btn" 
                            onClick={() => handleDeleteEntry(e.id)}
                            title="Delete this entry"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="charts-section">
        <h2 className="section-title">📊 Visual Analytics</h2>
        
        {/* Primary Charts Grid */}
        <div className="charts-grid-primary">
          {/* Income vs Expense Line Chart */}
          <div className="chart-card chart-large">
            <h3>📈 Income vs Expense Trend</h3>
            <div className="chart-wrapper-large">
              <Line data={getComparisonChartData()} options={chartOptions} />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="chart-card">
            <h3>🥧 Income vs Expense Distribution</h3>
            <div className="chart-wrapper">
              <Doughnut data={getPieChartData()} options={pieOptions} />
            </div>
          </div>
        </div>

        {/* Secondary Charts Grid */}
        <div className="charts-grid">
          {/* Comparison Bar Chart */}
          <div className="chart-card">
            <h3>📊 Monthly Comparison</h3>
            <div className="chart-wrapper">
              <Bar data={getBarChartData()} options={chartOptions} />
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="chart-card">
            <h3>🏷️ Expense by Category</h3>
            <div className="chart-wrapper">
              <Pie data={getCategoryChartData()} options={pieOptions} />
            </div>
          </div>

          {/* Savings Chart */}
          <div className="chart-card">
            <h3>💰 Monthly Savings</h3>
            <div className="chart-wrapper">
              <Bar data={getSavingsChartData()} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
