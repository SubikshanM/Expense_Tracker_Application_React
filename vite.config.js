import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // Use '/' for local development, '/Expense_Tracker_Application_React/' for GitHub Pages
  plugins: [react()],
})
