import { query } from '../config/database.js';

// Get all expenses for logged-in user
export const getExpenses = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC, id DESC',
      [req.user.userId]
    );

    res.json({
      success: true,
      expenses: result.rows
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses'
    });
  }
};

// Add new expense entry
export const addExpense = async (req, res) => {
  try {
    const { date, income, expense, description, category } = req.body;

    // Validation
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const result = await query(
      'INSERT INTO expenses (user_id, date, income, expense, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        req.user.userId,
        date,
        income || 0,
        expense || 0,
        category || 'Other'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding expense'
    });
  }
};

// Update expense entry
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, income, expense, description, category } = req.body;

    // Check if expense belongs to user
    const checkResult = await query(
      'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or unauthorized'
      });
    }

    const result = await query(
      'UPDATE expenses SET date = $1, income = $2, expense = $3, description = $4, category = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7 RETURNING *',
      [date, income || 0, expense || 0, description || null, category || 'Other', id, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense: result.rows[0]
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense'
    });
  }
};

// Delete expense entry
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense'
    });
  }
};

// Get expenses summary (monthly totals)
export const getExpensesSummary = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(income) as total_income,
        SUM(expense) as total_expense,
        SUM(income - expense) as net_balance
       FROM expenses 
       WHERE user_id = $1 
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      summary: result.rows
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching summary'
    });
  }
};
