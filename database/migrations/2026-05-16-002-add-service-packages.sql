CREATE TABLE IF NOT EXISTS service_package_plans (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sessions_count INTEGER NOT NULL CHECK (sessions_count > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_package_plans_service_id
  ON service_package_plans(service_id);

CREATE INDEX IF NOT EXISTS idx_service_package_plans_is_active
  ON service_package_plans(is_active);

CREATE TABLE IF NOT EXISTS client_service_packages (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  package_plan_id BIGINT NOT NULL REFERENCES service_package_plans(id) ON DELETE RESTRICT,
  code VARCHAR(12) NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_service_packages_status_check
    CHECK (status IN ('active', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_client_service_packages_client_id
  ON client_service_packages(client_id);

CREATE INDEX IF NOT EXISTS idx_client_service_packages_package_plan_id
  ON client_service_packages(package_plan_id);

CREATE INDEX IF NOT EXISTS idx_client_service_packages_status
  ON client_service_packages(status);

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS client_package_id BIGINT NULL
  REFERENCES client_service_packages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_client_package_id
  ON sessions(client_package_id);