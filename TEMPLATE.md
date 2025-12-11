# ADR Template

This template defines the standardized structure for all Architecture Decision Records (ADRs) in this project.

## Required Structure

### 1. Title
Format: `# ADR-XXX: [Decision Title]`
- Use sequential numbering (ADR-001, ADR-002, etc.)
- Title should be concise and descriptive

### 2. Revision Log
ALWAYS the first section after title.

```markdown
## Revision Log
| Date | Description |
|------|-------------|
| YYYY-MM-DD | Document created |
```

First entry must always be "Document created" with the creation date.

### 3. Context
1-2 sentences describing the problem or situation requiring a decision.
- State the technical or business challenge
- NO justification here (that goes in Decision section)

### 4. Decision
Specific action taken and approach selected.
- Start with "We will..." or "We use..."
- State WHAT was decided, not WHY
- Be precise and actionable

### 5. Consequences

#### Benefits
Positive outcomes and advantages of the decision.

#### Tradeoffs
Limitations, costs, or compromises accepted.

### 6. Implementation
Numbered steps for executing the decision.
- Keep strategic overview here
- Move detailed code/config to appendices

### 7. Related Decisions
Use standardized relationship types only (see CLAUDE.md for complete list):
- **Depends on**: ADR-XXX - [Brief context]
- **Extends**: ADR-XXX - [Brief context]
- **Constrains**: ADR-XXX - [Brief context]
- **Implements**: ADR-XXX - [Brief context]
- **Supersedes**: ADR-XXX - [Brief context]
- **Hub document for**: ADR-X, ADR-Y, ADR-Z
- **Part of**: ADR-XXX [Hub Title]
- **Consolidated by**: ADR-XXX

## Optional Sections

### 8. Future Considerations
Planned evolution, alternatives to revisit, or known limitations to address.

### 9. Appendices
Use descriptive names (not "Appendix A"):
- **Appendix: Code Examples**
- **Appendix: Configuration Details**
- **Appendix: Technical Specifications**

Place implementation details here instead of main body.

## Appendix Guidelines

**What Belongs in Appendices:**
- Code snippets and examples
- Detailed configuration files
- Technical specifications
- Data schemas
- API contracts
- Performance benchmarks

**What Stays in Main Body:**
- Strategic decisions and rationale
- High-level implementation steps
- Benefits and tradeoffs
- Relationship to other ADRs

## Forbidden Patterns

### NO Standalone Date Headers
❌ Wrong:
```markdown
## Date
2024-01-15

## Revision Log
| Date | Description |
```

✅ Correct:
```markdown
## Revision Log
| Date | Description |
| 2024-01-15 | Document created |
```

### NO Custom Relationship Types
Use ONLY standardized types from CLAUDE.md. Never use "Related to", "Associated with", or invented descriptors.

### NO Code in Main Body
Implementation details belong in appendices.

### NO Conversational Language
❌ Wrong: "This document describes our decision to use PostgreSQL..."
✅ Correct: "We use PostgreSQL for primary data storage."

## Example ADR Structure

```markdown
# ADR-001: Use PostgreSQL for Primary Database

## Revision Log
| Date | Description |
|------|-------------|
| 2024-01-15 | Document created |

## Context
The application requires persistent storage for user data, transactions, and analytics with strong consistency guarantees and complex query support.

## Decision
We use PostgreSQL 14+ as the primary database with JSONB support for semi-structured data.

## Consequences

### Benefits
- ACID compliance ensures data consistency
- Rich query capabilities with SQL and JSONB
- Mature ecosystem with extensive tooling

### Tradeoffs
- Higher operational complexity than NoSQL alternatives
- Vertical scaling limitations for extremely high write loads
- JSONB queries less performant than dedicated document stores

## Implementation
1. Provision PostgreSQL 14+ instance with replication
2. Configure connection pooling via PgBouncer
3. Implement migration framework using Alembic
4. Set up automated backups with point-in-time recovery

## Related Decisions
- **Extended by**: ADR-002 - Implements JSONB schema for user preferences
- **Constrains**: ADR-005 - Limits caching layer to read replicas only

## Future Considerations
Evaluate PostgreSQL 15 features (MERGE statement, query performance improvements) for next major version upgrade.

## Appendix: Database Configuration

```yaml
# postgresql.conf
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
```
```

## Notes
- Reference CLAUDE.md for relationship type definitions
- All dates use YYYY-MM-DD format
- Keep ADRs focused on single decisions
- Update revision log for all significant changes
