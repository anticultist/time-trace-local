-- General properties/settings table
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    string_value TEXT,
    int_value INTEGER,
    float_value REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

-- Clients/Jobs table
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    custom_fields TEXT, -- JSON field for user-defined fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

-- Projects table (can be standalone or linked to a client)
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    custom_fields TEXT, -- JSON field for user-defined fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Tags table (flat structure)
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT, -- Optional color for UI
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

-- Work types table (break, overtime, etc.)
CREATE TABLE work_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_billable BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

-- Bookable elements (tickets and manual entries)
CREATE TABLE bookable_elements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    client_id INTEGER,
    type TEXT NOT NULL CHECK (type IN ('ticket', 'manual')), -- ticket or manual entry
    external_id TEXT, -- For tickets from external systems (Jira, etc.)
    title TEXT NOT NULL,
    description TEXT,
    work_type_id INTEGER,
    custom_fields TEXT, -- JSON field for user-defined fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (work_type_id) REFERENCES work_types(id)
);

-- Events table (raw activity data)
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_system TEXT NOT NULL, -- 'pc_login', 'syslog', 'jira', 'git', 'filesystem', etc.
    start_time DATETIME NOT NULL,
    end_time DATETIME, -- Optional, may be null for instantaneous events
    duration_seconds INTEGER, -- Calculated or provided duration
    title TEXT,
    description TEXT,
    notes TEXT, -- User-added notes
    metadata TEXT, -- JSON field for source-specific structured data
    work_type_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (work_type_id) REFERENCES work_types(id)
);

-- Many-to-many relationship: Events to Tags
CREATE TABLE event_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    UNIQUE(event_id, tag_id)
);

-- Many-to-many relationship: Events to Bookable Elements with time allocation
CREATE TABLE event_bookable_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    bookable_element_id INTEGER NOT NULL,
    allocated_seconds INTEGER NOT NULL, -- Actual time allocated to this bookable element
    notes TEXT, -- Optional notes for this specific mapping
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (bookable_element_id) REFERENCES bookable_elements(id)
);

-- User-defined mapping rules (no versioning, applied externally)
CREATE TABLE mapping_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    pattern TEXT NOT NULL, -- Pattern to match (could be JSON for complex patterns)
    target_bookable_element_id INTEGER,
    target_work_type_id INTEGER,
    target_tags TEXT, -- JSON array of tag IDs to apply
    priority_order INTEGER DEFAULT 0, -- For rule ordering
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (target_bookable_element_id) REFERENCES bookable_elements(id),
    FOREIGN KEY (target_work_type_id) REFERENCES work_types(id)
);

-- Indexes for performance
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_source_system ON events(source_system);
CREATE INDEX idx_events_deleted ON events(deleted);
CREATE INDEX idx_event_bookable_mappings_event_id ON event_bookable_mappings(event_id);
CREATE INDEX idx_event_bookable_mappings_bookable_element_id ON event_bookable_mappings(bookable_element_id);
CREATE INDEX idx_event_tags_event_id ON event_tags(event_id);
CREATE INDEX idx_event_tags_tag_id ON event_tags(tag_id);
CREATE INDEX idx_bookable_elements_project_id ON bookable_elements(project_id);
CREATE INDEX idx_bookable_elements_client_id ON bookable_elements(client_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);

-- Triggers to update updated_at timestamps
CREATE TRIGGER update_clients_updated_at 
    AFTER UPDATE ON clients
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_projects_updated_at 
    AFTER UPDATE ON projects
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_events_updated_at 
    AFTER UPDATE ON events
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_bookable_elements_updated_at 
    AFTER UPDATE ON bookable_elements
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE bookable_elements SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_event_bookable_mappings_updated_at 
    AFTER UPDATE ON event_bookable_mappings
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE event_bookable_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_mapping_rules_updated_at 
    AFTER UPDATE ON mapping_rules
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE mapping_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Sample initial data
INSERT INTO properties (name, string_value) VALUES ('schema_version', '1.0.0');
INSERT INTO work_types (name, description, is_billable) VALUES 
    ('Regular', 'Regular work hours', TRUE),
    ('Overtime', 'Overtime work', TRUE),
    ('Break', 'Break time', FALSE),
    ('Meeting', 'Meeting time', TRUE);
