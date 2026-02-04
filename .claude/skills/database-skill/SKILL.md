---
name: database-skill
description: Design relational schemas, create tables, and manage migrations for PostgreSQL (including Neon Serverless).
---

# Database Skill – Schema Design & Migrations

## Instructions

1. **Schema Design**
   - Design normalized relational schemas
   - Define primary keys, foreign keys, and relationships
   - Apply proper data types and constraints
   - Follow naming conventions and consistency

2. **Table Creation**
   - Create tables with indexes and unique constraints
   - Enforce referential integrity
   - Optimize for query performance
   - Support soft deletes and audit fields where required

3. **Migrations**
   - Write forward and backward migrations
   - Ensure backward compatibility
   - Handle schema evolution safely
   - Support branching and preview databases (Neon)

4. **Version Control**
   - Track schema changes over time
   - Maintain migration ordering
   - Avoid destructive changes without fallback paths

## Best Practices
- Always use migrations, never manual production edits
- Keep tables small and well-indexed
- Avoid breaking changes without data backfills
- Use transactional migrations
- Validate schema changes in staging before production

## Example Structure
```sql
-- Migration: create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
