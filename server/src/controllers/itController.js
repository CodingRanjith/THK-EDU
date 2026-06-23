import {
  createClient,
  listClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
  listClientsBrief,
} from '../models/itClientModel.js'
import {
  createProposal,
  listProposals,
  getProposalById,
  updateProposal,
  deleteProposal,
  getProposalStats,
} from '../models/itProposalModel.js'
import {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats,
} from '../models/itProjectModel.js'
import {
  listProjectsWithTeam,
  listTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  listProjectAllocations,
  getProjectTeamStats,
  createAllocation,
  updateAllocation,
  deleteAllocation,
} from '../models/itTeamModel.js'

function pickBody(body, fields) {
  const data = {}
  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field]
  }
  return data
}

// --- Clients ---

export async function getClients(req, res) {
  const { search, status, paymentType, industry, limit, offset } = req.query
  const result = await listClients({
    search,
    status,
    paymentType,
    industry,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  })
  return res.json(result)
}

export async function getClientsStats(req, res) {
  const stats = await getClientStats()
  return res.json({ stats })
}

export async function getClientsBrief(req, res) {
  const clients = await listClientsBrief()
  return res.json({ clients })
}

export async function getClient(req, res) {
  const client = await getClientById(req.params.id)
  if (!client) return res.status(404).json({ message: 'Client not found' })
  return res.json({ client })
}

export async function createClientHandler(req, res) {
  const { clientName } = req.body
  if (!clientName?.trim()) {
    return res.status(400).json({ message: 'Client name is required' })
  }

  const client = await createClient(pickBody(req.body, [
    'clientName', 'organization', 'paymentType', 'payment', 'city', 'country',
    'gstNo', 'status', 'industry', 'category', 'leadSource',
  ]))

  return res.status(201).json({ message: 'Client created', client })
}

export async function updateClientHandler(req, res) {
  const client = await updateClient(req.params.id, pickBody(req.body, [
    'clientName', 'organization', 'paymentType', 'payment', 'city', 'country',
    'gstNo', 'status', 'industry', 'category', 'leadSource',
  ]))

  if (!client) return res.status(404).json({ message: 'Client not found' })
  return res.json({ message: 'Client updated', client })
}

export async function removeClient(req, res) {
  const deleted = await deleteClient(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Client not found' })
  return res.json({ message: 'Client deleted' })
}

// --- Proposals ---

export async function getProposals(req, res) {
  const { search, status, limit, offset } = req.query
  const result = await listProposals({
    search,
    status,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  })
  return res.json(result)
}

export async function getProposalsStats(req, res) {
  const stats = await getProposalStats()
  return res.json({ stats })
}

export async function getProposal(req, res) {
  const proposal = await getProposalById(req.params.id)
  if (!proposal) return res.status(404).json({ message: 'Proposal not found' })
  return res.json({ proposal })
}

export async function createProposalHandler(req, res) {
  const { proposalName } = req.body
  if (!proposalName?.trim()) {
    return res.status(400).json({ message: 'Proposal name is required' })
  }

  const proposal = await createProposal(pickBody(req.body, [
    'proposalName', 'organization', 'receivedDate', 'offerSubmissionDate',
    'proposalValue', 'remarks', 'notes', 'status',
  ]))

  return res.status(201).json({ message: 'Proposal created', proposal })
}

export async function updateProposalHandler(req, res) {
  const proposal = await updateProposal(req.params.id, pickBody(req.body, [
    'proposalName', 'organization', 'receivedDate', 'offerSubmissionDate',
    'proposalValue', 'remarks', 'notes', 'status',
  ]))

  if (!proposal) return res.status(404).json({ message: 'Proposal not found' })
  return res.json({ message: 'Proposal updated', proposal })
}

export async function removeProposal(req, res) {
  const deleted = await deleteProposal(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Proposal not found' })
  return res.json({ message: 'Proposal deleted' })
}

// --- Projects ---

export async function getProjects(req, res) {
  const { search, status, projectType, projectSource, clientId, limit, offset } = req.query
  const result = await listProjects({
    search,
    status,
    projectType,
    projectSource,
    clientId,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  })
  return res.json(result)
}

export async function getProjectsStats(req, res) {
  const stats = await getProjectStats()
  return res.json({ stats })
}

export async function getProject(req, res) {
  const project = await getProjectById(req.params.id)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  return res.json({ project })
}

export async function createProjectHandler(req, res) {
  const { projectName } = req.body
  if (!projectName?.trim()) {
    return res.status(400).json({ message: 'Project name is required' })
  }

  const project = await createProject(pickBody(req.body, [
    'projectName', 'clientId', 'projectType', 'projectSource',
    'startDate', 'endDate', 'status',
  ]))

  return res.status(201).json({ message: 'Project created', project })
}

export async function updateProjectHandler(req, res) {
  const project = await updateProject(req.params.id, pickBody(req.body, [
    'projectName', 'clientId', 'projectType', 'projectSource',
    'startDate', 'endDate', 'status',
  ]))

  if (!project) return res.status(404).json({ message: 'Project not found' })
  return res.json({ message: 'Project updated', project })
}

export async function removeProject(req, res) {
  const deleted = await deleteProject(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Project not found' })
  return res.json({ message: 'Project deleted' })
}

// --- Team Management ---

export async function getTeamProjects(req, res) {
  const { search, status, limit, offset } = req.query
  const result = await listProjectsWithTeam({
    search,
    status,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  })
  return res.json(result)
}

export async function getTeamMembers(req, res) {
  const { search, status } = req.query
  const members = await listTeamMembers({ search, status })
  return res.json({ members })
}

export async function createTeamMemberHandler(req, res) {
  const { memberName } = req.body
  if (!memberName?.trim()) {
    return res.status(400).json({ message: 'Member name is required' })
  }

  const member = await createTeamMember(pickBody(req.body, [
    'memberName', 'email', 'designation', 'defaultAvailableHours', 'status',
  ]))

  return res.status(201).json({ message: 'Team member created', member })
}

export async function updateTeamMemberHandler(req, res) {
  const member = await updateTeamMember(req.params.id, pickBody(req.body, [
    'memberName', 'email', 'designation', 'defaultAvailableHours', 'status',
  ]))

  if (!member) return res.status(404).json({ message: 'Team member not found' })
  return res.json({ message: 'Team member updated', member })
}

export async function removeTeamMember(req, res) {
  const deleted = await deleteTeamMember(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Team member not found' })
  return res.json({ message: 'Team member deleted' })
}

export async function getProjectTeam(req, res) {
  const project = await getProjectById(req.params.projectId)
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const { workArea } = req.query
  const allocations = await listProjectAllocations(req.params.projectId, { workArea })
  const stats = await getProjectTeamStats(req.params.projectId)

  return res.json({ project, allocations, stats })
}

export async function createAllocationHandler(req, res) {
  const project = await getProjectById(req.params.projectId)
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const { teamMemberId, workArea } = req.body
  if (!teamMemberId) return res.status(400).json({ message: 'Team member is required' })
  if (!workArea) return res.status(400).json({ message: 'Work area is required' })

  try {
    const allocation = await createAllocation(req.params.projectId, pickBody(req.body, [
      'teamMemberId', 'workArea', 'workingHours', 'availableHours', 'notes',
    ]))
    return res.status(201).json({ message: 'Team member allocated', allocation })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'This member is already allocated to this work area on this project',
      })
    }
    throw err
  }
}

export async function updateAllocationHandler(req, res) {
  try {
    const allocation = await updateAllocation(req.params.id, pickBody(req.body, [
      'teamMemberId', 'workArea', 'workingHours', 'availableHours', 'notes',
    ]))

    if (!allocation) return res.status(404).json({ message: 'Allocation not found' })
    return res.json({ message: 'Allocation updated', allocation })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'This member is already allocated to this work area on this project',
      })
    }
    throw err
  }
}

export async function removeAllocation(req, res) {
  const deleted = await deleteAllocation(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Allocation not found' })
  return res.json({ message: 'Allocation removed' })
}
