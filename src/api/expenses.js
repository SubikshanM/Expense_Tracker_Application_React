import api from './axios';

export const expenseAPI = {
  // Get all expenses
  getAll: async () => {
    const response = await api.get('/expenses');
    return response.data;
  },

  // Add new expense
  add: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Update expense
  update: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  // Delete expense
  delete: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  // Get monthly summary
  getSummary: async () => {
    const response = await api.get('/expenses/summary');
    return response.data;
  }
};
