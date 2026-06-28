import { getDashboardStats, getRecentActivity } from '../models/dashboardModel.js'

export async function getDashboard(_req, res) {
  const [stats, activity] = await Promise.all([getDashboardStats(), getRecentActivity()])

  return res.json({ stats, activity })
}
