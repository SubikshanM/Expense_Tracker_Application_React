import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const ExpenseTracker = () => {
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState("");
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  const groupByMonth = (data) => {
    const grouped = {};
    data.forEach((entry) => {
      const month = entry.date.slice(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(entry);
    });
    return grouped;
  };

  const handleAddEntry = () => {
    if (!date || (!income && !expense)) return;
    const newEntry = {
      date,
      income: income ? parseFloat(income) : 0,
      expense: expense ? parseFloat(expense) : 0,
    };
    setEntries((prev) => [...prev, newEntry]);
    setIncome("");
    setExpense("");
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
  };

  const handleCreateCSV = () => {
    const headers = ["date,income,expense"];
    const rows = entries.map(e => `${e.date},${e.income},${e.expense}`);
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expenses.csv";
    link.click();
  };

  const handleOpenCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.trim().split("\n").slice(1); // skip header
      const data = lines.map((line) => {
        const [date, income, expense] = line.split(",");
        return {
          date,
          income: parseFloat(income || 0),
          expense: parseFloat(expense || 0),
        };
      });
      setEntries(data);
    };
    reader.readAsText(file);
  };

  const grouped = groupByMonth(entries);

  return (
    <div className="container">
      <h1>Expense Tracker</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <input type="date" value={date} max={new Date().toISOString().split("T")[0]} onChange={(e) => setDate(e.target.value)} />
        <input type="number" placeholder="Income" value={income} onChange={(e) => setIncome(e.target.value)} />
        <input type="number" placeholder="Expense" value={expense} onChange={(e) => setExpense(e.target.value)} />
        <button type="button" onClick={handleAddEntry}>Add Entry</button>
        <button type="button" onClick={handleCreateCSV}>Create CSV</button>
        <input type="file" accept=".csv" onChange={handleOpenCSV} />
        <button type="button" onClick={handleDownloadExcel}>Download as Excel</button>
      </form>

      {Object.entries(grouped).map(([month, items]) => {
        let balance = 0;
        return (
          <div key={month}>
            <h2>{month}</h2>
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
                {items.map((item, idx) => {
                  balance += item.income - item.expense;
                  return (
                    <tr key={idx}>
                      <td>{item.date}</td>
                      <td>{item.income || "-"}</td>
                      <td>{item.expense || "-"}</td>
                      <td>{balance}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseTracker;
