-- IT & Assets: hardware and software inventory

CREATE TABLE IF NOT EXISTS it_hardware_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_number VARCHAR(20) NOT NULL UNIQUE,
  asset_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  purchase_date DATE,
  purchase_cost NUMERIC(14, 2),
  warranty_expiry DATE,
  assigned_to VARCHAR(150),
  location VARCHAR(150),
  status VARCHAR(30) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned', 'in_repair', 'retired', 'lost')),
  condition VARCHAR(20) NOT NULL DEFAULT 'good'
    CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS it_software_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  software_number VARCHAR(20) NOT NULL UNIQUE,
  software_name VARCHAR(200) NOT NULL,
  vendor VARCHAR(150),
  version VARCHAR(50),
  license_type VARCHAR(30) NOT NULL DEFAULT 'subscription'
    CHECK (license_type IN ('perpetual', 'subscription', 'open_source', 'trial')),
  license_key VARCHAR(255),
  total_licenses INTEGER NOT NULL DEFAULT 1,
  used_licenses INTEGER NOT NULL DEFAULT 0,
  purchase_date DATE,
  expiry_date DATE,
  cost NUMERIC(14, 2),
  assigned_to VARCHAR(150),
  department VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'trial', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_it_hardware_number ON it_hardware_assets(asset_number);
CREATE INDEX IF NOT EXISTS idx_it_hardware_status ON it_hardware_assets(status);
CREATE INDEX IF NOT EXISTS idx_it_hardware_category ON it_hardware_assets(category);

CREATE INDEX IF NOT EXISTS idx_it_software_number ON it_software_assets(software_number);
CREATE INDEX IF NOT EXISTS idx_it_software_status ON it_software_assets(status);
CREATE INDEX IF NOT EXISTS idx_it_software_vendor ON it_software_assets(vendor);

DROP TRIGGER IF EXISTS it_hardware_assets_updated_at ON it_hardware_assets;
CREATE TRIGGER it_hardware_assets_updated_at
  BEFORE UPDATE ON it_hardware_assets
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS it_software_assets_updated_at ON it_software_assets;
CREATE TRIGGER it_software_assets_updated_at
  BEFORE UPDATE ON it_software_assets
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
