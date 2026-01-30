import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { authAPI } from "./api/auth";
import { expenseAPI } from "./api/expenses";
import "./App.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState("");
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = () => {
      if (authAPI.isAuthenticated()) {
        const currentUser = authAPI.getCurrentUser();
        setUser(currentUser);
        loadExpenses();
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Load expenses from backend
  const loadExpenses = async () => {
    try {
      const data = await expenseAPI.getAll();
      const sortedExpenses = data.expenses.sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      setEntries(sortedExpenses);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    loadExpenses();
  };

  const handleSignup = (userData) => {
    setUser(userData);
    setEntries([]);
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setEntries([]);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return isLogin ? (
      <Login 
        onLogin={handleLogin} 
        onSwitchToSignup={() => setIsLogin(false)} 
      />
    ) : (
      <Signup 
        onSignup={handleSignup} 
        onSwitchToLogin={() => setIsLogin(true)} 
      />
    );
  }

  const handleAddEntry = async () => {
    if (!date) return;

    try {
      const newEntryData = {
        date,
        income: income ? parseFloat(income) : 0,
        expense: expense ? parseFloat(expense) : 0,
      };

      const data = await expenseAPI.add(newEntryData);
      const updatedEntries = [...entries, data.expense];
      updatedEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEntries(updatedEntries);

      setIncome("");
      setExpense("");
      setDate("");
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
  };

  const groupByMonth = () => {
    const groups = {};

    let cumulativeIncome = 0;
    let cumulativeExpense = 0;

    entries.forEach((e) => {
      const month = new Date(e.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!groups[month]) groups[month] = [];

      cumulativeIncome += e.income;
      cumulativeExpense += e.expense;

      groups[month].push({
        ...e,
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
      incomeData[monthIdx] += e.income;
      expenseData[monthIdx] += e.expense;
    });

    return {
      income: {
        labels: months,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            backgroundColor: "#4CAF50",
          },
        ],
      },
      expense: {
        labels: months,
        datasets: [
          {
            label: "Expenses",
            data: expenseData,
            backgroundColor: "#F44336",
          },
        ],
      },
    };
  };

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <header>
        <h1>Expense Tracker</h1>
        <div className="header-controls">
          <span className="user-email">👤 {user.email}</span>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="controls">
        <input
          type="date"
          max={new Date().toISOString().split("T")[0]}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="number"
          placeholder="Income"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
        />
        <input
          type="number"
          placeholder="Expense"
          value={expense}
          onChange={(e) => setExpense(e.target.value)}
        />
        <button onClick={handleAddEntry}>➕ Add Entry</button>
      </div>

      <div className="file-buttons">
        <button onClick={handleCreateCSV}>Create CSV</button>
        <button onClick={handleOpenCSV}>Open CSV</button>
        <button onClick={handleDownloadExcel}>Download Excel</button>
      </div>

      {Object.entries(groupByMonth()).map(([month, records]) => {
        const totalIncome = records.reduce((sum, r) => sum + r.income, 0);
        const totalExpense = records.reduce((sum, r) => sum + r.expense, 0);

        return (
          <div key={month} className="month-group">
            <h2>{month}</h2>
            <p>Total Income: Rs.{totalIncome}</p>
            <p>Total Expense: Rs.{totalExpense}</p>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Income</th>
                  <th>Expense</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {records.map((e, idx) => (
                  <tr key={idx}>
                    <td>{e.date}</td>
                    <td>{e.income}</td>
                    <td>{e.expense}</td>
                    <td>{e.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="charts">
        <h2>Monthly Income</h2>
        <Bar data={chartData().income} />

        <h2>Monthly Expenses</h2>
        <Bar data={chartData().expense} />
      </div>
    </div>
  );
}

export default App;
