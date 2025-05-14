import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Expense_Tracker_Application_React/', // IMPORTANT for GitHub Pages
  plugins: [react()],
})
