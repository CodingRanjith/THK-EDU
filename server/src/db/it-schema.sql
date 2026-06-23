CREATE TABLE IF NOT EXISTS it_sequences (
  prefix VARCHAR(10) PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS it_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_number VARCHAR(20) NOT NULL UNIQUE,
  client_name VARCHAR(200) NOT NULL,
  organization VARCHAR(200),
  payment_type VARCHAR(50),
  payment NUMERIC(14, 2),
  city VARCHAR(100),
  country VARCHAR(100),
  gst_no VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'on_hold')),
  industry VARCHAR(100),
  category VARCHAR(100),
  lead_source VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS it_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_number VARCHAR(20) NOT NULL UNIQUE,
  proposal_name VARCHAR(300) NOT NULL,
  organization VARCHAR(200),
  received_date DATE,
  offer_submission_date DATE,
  proposal_value NUMERIC(14, 2),
  remarks TEXT,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'won', 'lost', 'on_hold')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS it_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_number VARCHAR(20) NOT NULL UNIQUE,
  project_name VARCHAR(300) NOT NULL,
  client_id UUID REFERENCES it_clients(id) ON DELETE SET NULL,
  project_type VARCHAR(20) NOT NULL DEFAULT 'billable' CHECK (project_type IN ('billable', 'non_billable')),
  project_source VARCHAR(20) NOT NULL DEFAULT 'external' CHECK (project_source IN ('internal', 'external')),
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  status VARCHAR(30) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_it_clients_number ON it_clients(client_number);
CREATE INDEX IF NOT EXISTS idx_it_clients_status ON it_clients(status);
CREATE INDEX IF NOT EXISTS idx_it_clients_name ON it_clients(client_name);

CREATE INDEX IF NOT EXISTS idx_it_proposals_number ON it_proposals(proposal_number);
CREATE INDEX IF NOT EXISTS idx_it_proposals_status ON it_proposals(status);

CREATE INDEX IF NOT EXISTS idx_it_projects_number ON it_projects(project_number);
CREATE INDEX IF NOT EXISTS idx_it_projects_client ON it_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_it_projects_status ON it_projects(status);

DROP TRIGGER IF EXISTS it_clients_updated_at ON it_clients;
CREATE TRIGGER it_clients_updated_at
  BEFORE UPDATE ON it_clients
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS it_proposals_updated_at ON it_proposals;
CREATE TRIGGER it_proposals_updated_at
  BEFORE UPDATE ON it_proposals
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS it_projects_updated_at ON it_projects;
CREATE TRIGGER it_projects_updated_at
  BEFORE UPDATE ON it_projects
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
