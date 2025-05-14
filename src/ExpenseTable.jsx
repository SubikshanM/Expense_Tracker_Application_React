import React from 'react';

const ExpenseTable = ({ entries }) => {
  let balance = 0;

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Expense</th>
          <th>Income</th>
          <th>Description</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((entry, i) => {
          if (entry.type === 'Income') balance += entry.amount;
          else balance -= entry.amount;

          return (
            <tr key={i}>
              <td>{entry.date}</td>
              <td>{entry.type === 'Expense' ? `Rs. ${entry.amount}` : '-'}</td>
              <td>{entry.type === 'Income' ? `Rs. ${entry.amount}` : '-'}</td>
              <td>{entry.description || '-'}</td>
              <td>{`Rs. ${balance}`}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ExpenseTable;
