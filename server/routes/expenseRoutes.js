import express from 'express';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary
} from '../controllers/expenseController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Expense routes
router.get('/', getExpenses);
router.post('/', addExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.get('/summary', getExpensesSummary);

export default router;
