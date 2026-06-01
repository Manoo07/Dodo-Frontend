import axios from 'axios'

// Dev  → VITE_API_URL is not set, Vite proxies /api → localhost:3000
// Prod → VITE_API_URL=https://your-backend.com  (set in .env.production or CI secret)
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const client = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('dodo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
