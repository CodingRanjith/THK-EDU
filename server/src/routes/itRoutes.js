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

export default router
