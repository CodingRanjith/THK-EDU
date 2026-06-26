import {
  createHardware,
  listHardware,
  getHardwareById,
  updateHardware,
  deleteHardware,
  getHardwareStats,
} from '../models/itHardwareModel.js'
import {
  createSoftware,
  listSoftware,
  getSoftwareById,
  updateSoftware,
  deleteSoftware,
  getSoftwareStats,
} from '../models/itSoftwareModel.js'

const HARDWARE_CATEGORIES = ['laptop', 'desktop', 'monitor', 'printer', 'server', 'network', 'mobile', 'other']
const HARDWARE_STATUSES = ['available', 'assigned', 'in_repair', 'retired', 'lost']
const HARDWARE_CONDITIONS = ['new', 'good', 'fair', 'poor']
const LICENSE_TYPES = ['perpetual', 'subscription', 'open_source', 'trial']
const SOFTWARE_STATUSES = ['active', 'expired', 'trial', 'cancelled']

export async function getHardwareList(req, res) {
  const { search, status, category } = req.query
  const data = await listHardware({ search, status, category })
  return res.json(data)
}

export async function getHardwareStatsHandler(_req, res) {
  const stats = await getHardwareStats()
  return res.json({ stats })
}

export async function getHardware(req, res) {
  const asset = await getHardwareById(req.params.id)
  if (!asset) return res.status(404).json({ message: 'Hardware asset not found' })
  return res.json({ asset })
}

export async function createHardwareHandler(req, res) {
  const { assetName, category, status, condition } = req.body

  if (!assetName?.trim()) {
    return res.status(400).json({ message: 'Asset name is required' })
  }
  if (category && !HARDWARE_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Invalid category' })
  }
  if (status && !HARDWARE_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }
  if (condition && !HARDWARE_CONDITIONS.includes(condition)) {
    return res.status(400).json({ message: 'Invalid condition' })
  }

  const asset = await createHardware({
    assetName: assetName.trim(),
    category,
    brand: req.body.brand,
    model: req.body.model,
    serialNumber: req.body.serialNumber,
    purchaseDate: req.body.purchaseDate,
    purchaseCost: req.body.purchaseCost,
    warrantyExpiry: req.body.warrantyExpiry,
    assignedTo: req.body.assignedTo,
    location: req.body.location,
    status,
    condition,
    notes: req.body.notes,
  })

  return res.status(201).json({ message: 'Hardware asset created', asset })
}

export async function updateHardwareHandler(req, res) {
  const { assetName, category, status, condition } = req.body

  if (!assetName?.trim()) {
    return res.status(400).json({ message: 'Asset name is required' })
  }
  if (category && !HARDWARE_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Invalid category' })
  }
  if (status && !HARDWARE_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }
  if (condition && !HARDWARE_CONDITIONS.includes(condition)) {
    return res.status(400).json({ message: 'Invalid condition' })
  }

  const asset = await updateHardware(req.params.id, {
    assetName: assetName.trim(),
    category,
    brand: req.body.brand,
    model: req.body.model,
    serialNumber: req.body.serialNumber,
    purchaseDate: req.body.purchaseDate,
    purchaseCost: req.body.purchaseCost,
    warrantyExpiry: req.body.warrantyExpiry,
    assignedTo: req.body.assignedTo,
    location: req.body.location,
    status,
    condition,
    notes: req.body.notes,
  })

  if (!asset) return res.status(404).json({ message: 'Hardware asset not found' })
  return res.json({ message: 'Hardware asset updated', asset })
}

export async function removeHardware(req, res) {
  const deleted = await deleteHardware(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Hardware asset not found' })
  return res.json({ message: 'Hardware asset deleted' })
}

export async function getSoftwareList(req, res) {
  const { search, status, licenseType } = req.query
  const data = await listSoftware({ search, status, licenseType })
  return res.json(data)
}

export async function getSoftwareStatsHandler(_req, res) {
  const stats = await getSoftwareStats()
  return res.json({ stats })
}

export async function getSoftware(req, res) {
  const software = await getSoftwareById(req.params.id)
  if (!software) return res.status(404).json({ message: 'Software asset not found' })
  return res.json({ software })
}

export async function createSoftwareHandler(req, res) {
  const { softwareName, licenseType, status, totalLicenses, usedLicenses } = req.body

  if (!softwareName?.trim()) {
    return res.status(400).json({ message: 'Software name is required' })
  }
  if (licenseType && !LICENSE_TYPES.includes(licenseType)) {
    return res.status(400).json({ message: 'Invalid license type' })
  }
  if (status && !SOFTWARE_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }
  if (usedLicenses != null && totalLicenses != null && Number(usedLicenses) > Number(totalLicenses)) {
    return res.status(400).json({ message: 'Used licenses cannot exceed total licenses' })
  }

  const software = await createSoftware({
    softwareName: softwareName.trim(),
    vendor: req.body.vendor,
    version: req.body.version,
    licenseType,
    licenseKey: req.body.licenseKey,
    totalLicenses,
    usedLicenses,
    purchaseDate: req.body.purchaseDate,
    expiryDate: req.body.expiryDate,
    cost: req.body.cost,
    assignedTo: req.body.assignedTo,
    department: req.body.department,
    status,
    notes: req.body.notes,
  })

  return res.status(201).json({ message: 'Software asset created', software })
}

export async function updateSoftwareHandler(req, res) {
  const { softwareName, licenseType, status, totalLicenses, usedLicenses } = req.body

  if (!softwareName?.trim()) {
    return res.status(400).json({ message: 'Software name is required' })
  }
  if (licenseType && !LICENSE_TYPES.includes(licenseType)) {
    return res.status(400).json({ message: 'Invalid license type' })
  }
  if (status && !SOFTWARE_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }
  if (usedLicenses != null && totalLicenses != null && Number(usedLicenses) > Number(totalLicenses)) {
    return res.status(400).json({ message: 'Used licenses cannot exceed total licenses' })
  }

  const software = await updateSoftware(req.params.id, {
    softwareName: softwareName.trim(),
    vendor: req.body.vendor,
    version: req.body.version,
    licenseType,
    licenseKey: req.body.licenseKey,
    totalLicenses,
    usedLicenses,
    purchaseDate: req.body.purchaseDate,
    expiryDate: req.body.expiryDate,
    cost: req.body.cost,
    assignedTo: req.body.assignedTo,
    department: req.body.department,
    status,
    notes: req.body.notes,
  })

  if (!software) return res.status(404).json({ message: 'Software asset not found' })
  return res.json({ message: 'Software asset updated', software })
}

export async function removeSoftware(req, res) {
  const deleted = await deleteSoftware(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Software asset not found' })
  return res.json({ message: 'Software asset deleted' })
}
