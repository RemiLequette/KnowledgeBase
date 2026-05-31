# SQLite MCP Convention

## Quick Start

Convention SQLite MCP — règles critiques pour les opérations en base de données. Charger pour tout travail avec SQLite : requêtes, écritures, DDL. Couvre l'ordre des statements, la vérification après write, et la mise à jour du schema.

## Tool
`sqlite:execute_query` — MCP tool for all SQLite operations (read and write).

Set `read_only: true` for SELECT queries as a safety guard.
Omit or set `read_only: false` for INSERT / UPDATE / DELETE / ALTER.

---

## Critical: one statement per call

The SQLite MCP does **not** execute multiple statements separated by `;` in a single call.
Only the first statement runs — the rest are silently ignored.

**Wrong:**
```sql
UPDATE test_scenarios SET scenario = 'Note CRUD' WHERE id = '2.4';
DELETE FROM test_scenarios WHERE id IN ('2.5','2.6');
```

**Correct:** two separate `execute_query` calls.

---

## Statement ordering

When a sequence of writes depends on referential integrity or key uniqueness:

1. DELETE first (remove old links / rows)
2. INSERT after (add new links / rows)

Reversing this order causes PRIMARY KEY or FOREIGN KEY conflicts.

---

## Always verify after writes

After every INSERT / UPDATE / DELETE, immediately run a SELECT to confirm the result
before continuing. The MCP can succeed silently on a zero-row match.

```sql
-- After update, verify:
SELECT id, scenario FROM test_scenarios WHERE id = '2.4';
```

---

## Batching reads vs writes

- **Reads**: safe to combine multiple JOINs in one SELECT — prefer fewer calls.
- **Writes**: one statement per call, verified after each one.

---

## Schema changes

After any DDL (ALTER TABLE, CREATE TABLE, DROP TABLE, CREATE VIEW):
- Immediately update the versioned `schema.sql` file.
- This is the only schema artifact tracked in Git — the `.db` file is gitignored.

---

## Keywords
sqlite, MCP, SQL, database, schema, write, query, conventions, DDL

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Convention SQLite MCP — regles d'execution de requetes SQL.

**Contenu initial :**
- Une instruction par appel
- Ordre DELETE avant INSERT
- Verification apres chaque write
- Mise a jour de schema.sql apres DDL
