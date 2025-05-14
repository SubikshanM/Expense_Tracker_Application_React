import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function ChartComponent({ monthlyData }) {
  const months = Object.keys(monthlyData);
  const incomeData = months.map(month => monthlyData[month].income);
  const expenseData = months.map(month => monthlyData[month].expense);

  const incomeChart = {
    labels: months,
    datasets: [{
      label: 'Monthly Income',
      data: incomeData,
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
    }]
  };

  const expenseChart = {
    labels: months,
    datasets: [{
      label: 'Monthly Expense',
      data: expenseData,
      backgroundColor: 'rgba(255, 99, 132, 0.7)',
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    }
  };

  return (
    <div className="charts">
      <h2>Monthly Income</h2>
      <Bar data={incomeChart} options={options} />
      <h2>Monthly Expense</h2>
      <Bar data={expenseChart} options={options} />
    </div>
  );
}

export default ChartComponent;
