// API base URLs — local first, then production (picked by hostname at runtime)
// Override on Netlify with VITE_API_URL if your backend URL differs.
export const API_URLS = [
  import.meta.env.VITE_API_URL,
  'http://localhost:5000/api',
  'https://thk-edu.onrender.com/api',
].filter(Boolean)
