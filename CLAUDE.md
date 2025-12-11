# ADR Index - Weight Stock Platform 2.0

This document serves as the central index for all Architecture Decision Records (ADRs) in the Weight Stock Platform 2.0 project.

## Structured ADR List

### ADR-001: Client-Side Price Calculation
- **Date**: 2025-12-10
- **Status**: Adopted
- **Relationships**:
  - Part of: ADR-005 (Technology Stack Selection)
  - Consolidated by: ADR-005
- **Summary**: Price calculations execute in frontend to prevent weight data transmission to server

### ADR-002: Session-Based Authentication
- **Date**: 2025-12-10
- **Status**: Adopted
- **Relationships**:
  - Part of: ADR-005 (Technology Stack Selection)
  - Consolidated by: ADR-005
  - Extended by: ADR-006 (Production Bug Fixes)
- **Summary**: Flask-Session with HttpOnly cookies for authentication instead of JWT

### ADR-003: Server-Side Moving Average Calculation
- **Date**: 2025-12-10
- **Status**: Adopted
- **Relationships**:
  - Part of: ADR-005 (Technology Stack Selection)
  - Consolidated by: ADR-005
- **Summary**: Backend pre-computes moving averages (MA5/10/20/50) using pandas for chart data

### ADR-004: Immutable User Roles
- **Date**: 2025-12-10
- **Status**: Adopted
- **Relationships**:
  - Depends on: ADR-002 (Session-Based Authentication)
  - Part of: ADR-005 (Technology Stack Selection)
  - Consolidated by: ADR-005
- **Summary**: User roles are set at registration and cannot be modified afterward

### ADR-005: Technology Stack Selection
- **Date**: 2025-12-10
- **Status**: Adopted (Hub Document)
- **Relationships**:
  - Hub document for: ADR-001, ADR-002, ADR-003, ADR-004
- **Summary**: Unified technology stack decisions for Weight Stock Platform 2.0 frontend and backend

### ADR-006: Production Bug Fixes for Authentication and Internationalization
- **Date**: 2025-12-11
- **Status**: Adopted
- **Relationships**:
  - Extends: ADR-002 (Session-Based Authentication)
- **Summary**: Fixes for 401 interceptor excluding /auth/me, Flask-Session NULL expiry workaround, and complete internationalization implementation

### ADR-007: Trading Features Implementation
- **Date**: 2025-12-11
- **Status**: Adopted
- **Relationships**:
  - Depends on: ADR-002 (Session-Based Authentication)
  - Part of: ADR-005 (Technology Stack Selection)
  - Consolidated by: ADR-005
- **Summary**: Buyer P&L tracking with average cost method, seller balance system, TradeHistory refresh mechanism, and price chart UI enhancements

## Relationship Type Definitions

### Standard Relationship Types

**Depends on**: This ADR requires another ADR's decisions or infrastructure
- Example: ADR-004 depends on ADR-002 (authentication required for role management)
- **Reverse**: Depended on by

**Extends**: This ADR adds capabilities to another ADR without changing its core decision
- Example: OAuth support extends base authentication framework
- **Reverse**: Extended by

**Constrains**: This ADR limits or restricts another ADR's implementation
- Example: Cache TTL policy constrains data storage decisions
- **Reverse**: Constrained by

**Implements**: This ADR provides concrete implementation of another ADR's specification
- Example: Specific database schema implements data model ADR
- **Reverse**: Implemented by

**Supersedes**: This ADR replaces a previous decision
- Example: New logging framework supersedes old approach
- **Reverse**: Superseded by

### Hub-Spoke Relationship Types

**Hub document for**: Lists all spoke ADRs consolidated by this hub
- Used in hub documents only
- Must list ALL spokes (ADR-X, ADR-Y, ADR-Z format)

**Part of**: Links spoke ADR to its hub, appears immediately after revision log
- Used in spoke documents only
- Format: "Part of: ADR-XXX [Hub Title]"

**Consolidated by**: References hub from spoke's Related Decisions section
- Used in spoke documents only
- Complements "Part of" reference

**Spoke document for**: Indicates this ADR provides detailed implementation for hub
- Rarely used (implied by "Part of" relationship)

### Relationship Reciprocity Rules

1. All hub-spoke relationships MUST be bidirectional
2. Hub lists spokes in "Hub document for:" → Each spoke has "Part of:" AND "Consolidated by:"
3. Creating/updating hub ALWAYS updates all spoke ADRs immediately
4. Creating/updating spoke ALWAYS updates hub document

## Hub-and-Spoke Architecture Pattern

### Pattern Purpose
Organizes complex architectural domains by separating strategic overview (hub) from implementation details (spokes).

### Key Characteristics
- **Hub documents**: Strategic overview, canonical definitions, cross-cutting concerns
- **Spoke documents**: Implementation specifics, code examples, domain constraints
- **Bidirectional references**: Always maintained automatically
- **Single source of truth**: Canonical definitions live in hubs

### Current Hub-Spoke Structures

**ADR-005: Technology Stack Selection (Hub)**
- Consolidates technology choices across frontend, backend, and database
- Spokes: ADR-001 (Client-Side Calculation), ADR-002 (Authentication), ADR-003 (Moving Averages), ADR-004 (User Roles), ADR-007 (Trading Features)

## Dependency Graph Summary

```
ADR-005 (Technology Stack - Hub)
├── ADR-001 (Client-Side Price Calculation)
├── ADR-002 (Session-Based Authentication)
│   ├── ADR-004 (Immutable User Roles) [depends on ADR-002]
│   ├── ADR-006 (Bug Fixes) [extends ADR-002]
│   └── ADR-007 (Trading Features) [depends on ADR-002]
├── ADR-003 (Server-Side Moving Average Calculation)
└── ADR-007 (Trading Features Implementation)
```

## ADR Lifecycle States

- **Proposed**: Under discussion, not yet adopted
- **Adopted**: Active decision guiding current implementation
- **Deprecated**: No longer recommended but still in use
- **Superseded**: Replaced by newer decision (reference new ADR)
- **Archived**: Historical record, no longer applicable

## Notes

- All ADRs use YYYY-MM-DD date format
- Relationship types are standardized (see definitions above)
- Hub documents consolidate related decisions
- Spoke documents reference hubs bidirectionally
- TEMPLATE.md contains detailed ADR structure requirements
