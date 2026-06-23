export const WORK_AREAS = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'database', label: 'Database' },
  { value: 'api_integration', label: 'API Integration' },
  { value: 'testing', label: 'Testing / QA' },
  { value: 'devops', label: 'DevOps' },
  { value: 'ui_ux', label: 'UI/UX Design' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'other', label: 'Other' },
]

export function getWorkAreaLabel(value) {
  return WORK_AREAS.find((a) => a.value === value)?.label || value
}
