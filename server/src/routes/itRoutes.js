import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getClients,
  getClientsStats,
  getClientsBrief,
  getClient,
  createClientHandler,
  updateClientHandler,
  removeClient,
  getProposals,
  getProposalsStats,
  getProposal,
  createProposalHandler,
  updateProposalHandler,
  removeProposal,
  getProjects,
  getProjectsStats,
  getProject,
  createProjectHandler,
  updateProjectHandler,
  removeProject,
  getTeamProjects,
  getTeamMembers,
  createTeamMemberHandler,
  updateTeamMemberHandler,
  removeTeamMember,
  getProjectTeam,
  createAllocationHandler,
  updateAllocationHandler,
  removeAllocation,
} from '../controllers/itController.js'

const router = Router()

router.use(authenticate)

// Clients
router.get('/clients/stats', getClientsStats)
router.get('/clients/brief', getClientsBrief)
router.get('/clients', getClients)
router.post('/clients', createClientHandler)
router.get('/clients/:id', getClient)
router.put('/clients/:id', updateClientHandler)
router.delete('/clients/:id', removeClient)

// Proposals
router.get('/proposals/stats', getProposalsStats)
router.get('/proposals', getProposals)
router.post('/proposals', createProposalHandler)
router.get('/proposals/:id', getProposal)
router.put('/proposals/:id', updateProposalHandler)
router.delete('/proposals/:id', removeProposal)

// Projects
router.get('/projects/stats', getProjectsStats)
router.get('/projects', getProjects)
router.post('/projects', createProjectHandler)
router.get('/projects/:id', getProject)
router.put('/projects/:id', updateProjectHandler)
router.delete('/projects/:id', removeProject)

// Team Management
router.get('/team/projects', getTeamProjects)
router.get('/team/members', getTeamMembers)
router.post('/team/members', createTeamMemberHandler)
router.put('/team/members/:id', updateTeamMemberHandler)
router.delete('/team/members/:id', removeTeamMember)
router.get('/team/projects/:projectId', getProjectTeam)
router.post('/team/projects/:projectId/allocations', createAllocationHandler)
router.put('/team/allocations/:id', updateAllocationHandler)
router.delete('/team/allocations/:id', removeAllocation)

export default router
