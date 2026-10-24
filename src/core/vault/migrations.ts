import { INITIAL_SCHEMA_SQL } from './schema';

export interface Migration {
  version: number;
  description: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema baseline',
    sql: INITIAL_SCHEMA_SQL
  },
  {
    version: 2,
    description: 'Add support for tab groups and note revision timestamps',
    sql: `
      ALTER TABLE items ADD COLUMN note_updated_at TEXT;
      ALTER TABLE sessions ADD COLUMN window_group_count INTEGER DEFAULT 0;
    `
  }
];

export class MigrationRunner {
  private currentVersion: number = 0;

  constructor(initialVersion = 0) {
    this.currentVersion = initialVersion;
  }

  public getVersion(): number {
    return this.currentVersion;
  }

  public getPendingMigrations(): Migration[] {
    return MIGRATIONS.filter(m => m.version > this.currentVersion);
  }

  public applyPendingMigrations(executeSql: (sql: string) => void): number {
    const pending = this.getPendingMigrations();
    for (const migration of pending) {
      executeSql(migration.sql);
      this.currentVersion = migration.version;
    }
    return this.currentVersion;
  }
}
