-- Finance: accounts receivable and payable

CREATE TABLE IF NOT EXISTS finance_receivables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_number VARCHAR(20) NOT NULL UNIQUE,
  party_name VARCHAR(200) NOT NULL,
  invoice_number VARCHAR(100),
  description TEXT,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  settled_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'received', 'overdue', 'cancelled')),
  category VARCHAR(100),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_payables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_number VARCHAR(20) NOT NULL UNIQUE,
  party_name VARCHAR(200) NOT NULL,
  invoice_number VARCHAR(100),
  description TEXT,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  settled_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  category VARCHAR(100),
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_receivables_date ON finance_receivables(transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_receivables_status ON finance_receivables(status);
CREATE INDEX IF NOT EXISTS idx_finance_receivables_party ON finance_receivables(party_name);

CREATE INDEX IF NOT EXISTS idx_finance_payables_date ON finance_payables(transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_payables_status ON finance_payables(status);
CREATE INDEX IF NOT EXISTS idx_finance_payables_party ON finance_payables(party_name);

DROP TRIGGER IF EXISTS finance_receivables_updated_at ON finance_receivables;
CREATE TRIGGER finance_receivables_updated_at
  BEFORE UPDATE ON finance_receivables
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS finance_payables_updated_at ON finance_payables;
CREATE TRIGGER finance_payables_updated_at
  BEFORE UPDATE ON finance_payables
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
