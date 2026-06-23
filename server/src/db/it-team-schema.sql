CREATE TABLE IF NOT EXISTS it_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  designation VARCHAR(100),
  default_available_hours NUMERIC(6, 2) NOT NULL DEFAULT 40,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS it_project_team_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES it_projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES it_team_members(id) ON DELETE CASCADE,
  work_area VARCHAR(50) NOT NULL CHECK (work_area IN (
    'frontend', 'backend', 'database', 'api_integration', 'testing',
    'devops', 'ui_ux', 'mobile', 'documentation', 'project_management', 'other'
  )),
  working_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  available_hours NUMERIC(6, 2) NOT NULL DEFAULT 40,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, team_member_id, work_area)
);

CREATE INDEX IF NOT EXISTS idx_it_team_members_status ON it_team_members(status);
CREATE INDEX IF NOT EXISTS idx_it_team_members_name ON it_team_members(member_name);

CREATE INDEX IF NOT EXISTS idx_it_allocations_project ON it_project_team_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_it_allocations_member ON it_project_team_allocations(team_member_id);
CREATE INDEX IF NOT EXISTS idx_it_allocations_work_area ON it_project_team_allocations(work_area);

DROP TRIGGER IF EXISTS it_team_members_updated_at ON it_team_members;
CREATE TRIGGER it_team_members_updated_at
  BEFORE UPDATE ON it_team_members
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS it_project_team_allocations_updated_at ON it_project_team_allocations;
CREATE TRIGGER it_project_team_allocations_updated_at
  BEFORE UPDATE ON it_project_team_allocations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
