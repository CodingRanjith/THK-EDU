CREATE TABLE IF NOT EXISTS document_sequences (
  prefix VARCHAR(10) PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_number VARCHAR(20) NOT NULL UNIQUE,
  document_type VARCHAR(50) NOT NULL,
  recipient_name VARCHAR(200) NOT NULL,
  recipient_email VARCHAR(255),
  title VARCHAR(300) NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  html_content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'sent')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_number ON documents(document_number);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
