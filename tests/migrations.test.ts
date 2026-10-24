import { describe, it, expect, vi } from 'vitest';
import { MigrationRunner, MIGRATIONS } from '../src/core/vault/migrations';
import { INITIAL_SCHEMA_SQL } from '../src/core/vault/schema';

describe('MigrationRunner & Database Schema (PRD Section 11.6)', () => {
  it('correctly identifies pending migrations from version 0', () => {
    const runner = new MigrationRunner(0);
    expect(runner.getVersion()).toBe(0);

    const pending = runner.getPendingMigrations();
    expect(pending.length).toBe(MIGRATIONS.length);
    expect(pending[0].version).toBe(1);
    expect(pending[1].version).toBe(2);
  });

  it('applies pending migrations and updates runner version', () => {
    const runner = new MigrationRunner(0);
    const executedQueries: string[] = [];
    const mockExecuteSql = vi.fn().mockImplementation((sql: string) => {
      executedQueries.push(sql);
    });

    const finalVersion = runner.applyPendingMigrations(mockExecuteSql);

    expect(finalVersion).toBe(2);
    expect(runner.getVersion()).toBe(2);
    expect(mockExecuteSql).toHaveBeenCalledTimes(2);

    // Initial schema contains required tables
    expect(executedQueries[0]).toContain('CREATE TABLE IF NOT EXISTS vaults');
    expect(executedQueries[0]).toContain('CREATE TABLE IF NOT EXISTS items');
    expect(executedQueries[0]).toContain('CREATE TABLE IF NOT EXISTS sessions');
    expect(executedQueries[0]).toContain('CREATE TABLE IF NOT EXISTS collections');
    expect(executedQueries[0]).toContain('CREATE TABLE IF NOT EXISTS tags');
    expect(executedQueries[0]).toContain('CREATE TABLE IF NOT EXISTS archives');

    // Migration 2 contains alter table
    expect(executedQueries[1]).toContain('note_updated_at');

    // No pending migrations after execution
    expect(runner.getPendingMigrations().length).toBe(0);
  });

  it('filters out already applied migrations when instantiated with higher version', () => {
    const runner = new MigrationRunner(1);
    const pending = runner.getPendingMigrations();

    expect(pending.length).toBe(1);
    expect(pending[0].version).toBe(2);

    const mockExecuteSql = vi.fn();
    runner.applyPendingMigrations(mockExecuteSql);
    expect(mockExecuteSql).toHaveBeenCalledTimes(1);
    expect(runner.getVersion()).toBe(2);
  });

  it('verifies initial schema SQL baseline includes required foreign keys and indexes', () => {
    expect(INITIAL_SCHEMA_SQL).toContain('FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE');
    expect(INITIAL_SCHEMA_SQL).toContain('CREATE INDEX IF NOT EXISTS idx_items_url');
    expect(INITIAL_SCHEMA_SQL).toContain('CREATE INDEX IF NOT EXISTS idx_items_normalized_url');
    expect(INITIAL_SCHEMA_SQL).toContain('CREATE INDEX IF NOT EXISTS idx_items_saved_at');
  });
});
