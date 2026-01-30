-- Expense Tracker Database Schema for Neon PostgreSQL
-- Execute this in your Neon SQL Editor

-- 1. Users Table (stores user authentication data)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Expenses Table (stores income and expense entries)
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  income DECIMAL(10, 2) DEFAULT 0.00,
  expense DECIMAL(10, 2) DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);

-- Optional: Create a view for easy access to user expenses with calculated balance
CREATE OR REPLACE VIEW user_expenses_with_balance AS
SELECT 
  e.id,
  e.user_id,
  e.date,
  e.income,
  e.expense,
  e.description,
  e.created_at,
  u.email,
  u.name,
  SUM(e.income - e.expense) OVER (
    PARTITION BY e.user_id 
    ORDER BY e.date, e.id
  ) as running_balance
FROM expenses e
JOIN users u ON e.user_id = u.id
ORDER BY e.user_id, e.date;
