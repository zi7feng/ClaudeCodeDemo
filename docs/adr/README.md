# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Weight Stock Platform 2.0 project.

## Quick Navigation

- **CLAUDE.md** (Project Root) - ADR index and relationship definitions
- **TEMPLATE.md** (Project Root) - ADR structure template and guidelines

## All ADRs

### Hub Documents
- [ADR-005: Technology Stack Selection](./ADR-005-technology-stack-selection.md) - Unified technology choices for frontend, backend, and database

### Core Architecture Decisions
- [ADR-001: Client-Side Price Calculation](./ADR-001-client-side-price-calculation.md) - Privacy-preserving price calculations in frontend
- [ADR-002: Session-Based Authentication](./ADR-002-session-based-authentication.md) - Flask-Session with HttpOnly cookies
- [ADR-003: Server-Side Moving Average Calculation](./ADR-003-server-side-moving-average-calculation.md) - Backend pre-computation using pandas
- [ADR-004: Immutable User Roles](./ADR-004-immutable-user-roles.md) - Role assignment at registration only

## Architecture Overview

```
Weight Stock Platform 2.0
│
├── Frontend (React + Vite + MUI)
│   ├── Price Calculation (ADR-001)
│   ├── Session Management (ADR-002)
│   └── Chart Rendering (ADR-003)
│
├── Backend (Flask + pandas + SQLAlchemy)
│   ├── Session Storage (ADR-002)
│   ├── Moving Averages (ADR-003)
│   └── User Management (ADR-004)
│
└── Database (MySQL 8.0+)
    ├── User Roles (ADR-004)
    └── Price Records (ADR-001)
```

## Key Architectural Principles

### Privacy-First Design
**ADR-001** ensures weight data never leaves the client device. All price calculations occur in the frontend, with only final prices transmitted to the backend.

### Session-Based Security
**ADR-002** implements Flask-Session with HttpOnly cookies for robust authentication that prevents XSS attacks and enables server-side session revocation.

### Performance Optimization
**ADR-003** leverages pandas in the backend for efficient time-series calculations, keeping frontend focused on rendering while backend handles computational workload.

### Simplified Authorization
**ADR-004** enforces immutable user roles to maintain consistent permissions and eliminate complex role migration logic.

## Technology Stack Summary

| Layer | Technologies | Rationale ADR |
|-------|-------------|---------------|
| Frontend | React 18, Vite, MUI, Coinbase DS, i18n, Axios | ADR-005 |
| Backend | Flask 3, Flask-Session, SQLAlchemy, pandas | ADR-005 |
| Database | MySQL 8.0+ (InnoDB, UTF8MB4) | ADR-005 |
| Auth | Session-based with HttpOnly cookies | ADR-002 |
| Analytics | pandas for moving averages | ADR-003 |

## Relationship Diagram

```
ADR-005 (Technology Stack Hub)
├─→ ADR-001 (Client-Side Calculation)
├─→ ADR-002 (Session Authentication)
│   └─→ ADR-004 (Immutable Roles) [depends on]
└─→ ADR-003 (Moving Averages)
```

## How to Use These ADRs

### For Developers
1. Start with **ADR-005** for overall technology stack understanding
2. Read **ADR-001** before implementing weight input components
3. Review **ADR-002** before working on authentication flows
4. Check **ADR-003** for chart data API integration
5. Understand **ADR-004** before modifying user management

### For Architects
- **CLAUDE.md** provides comprehensive relationship mapping
- Hub-spoke structure (ADR-005 + spokes) organizes related decisions
- Each ADR includes implementation appendices with code examples

### For Product Managers
- Context sections explain business rationale
- Consequences sections detail benefits and tradeoffs
- Future Considerations sections identify evolution opportunities

## Creating New ADRs

1. Read **TEMPLATE.md** for structure requirements
2. Check **CLAUDE.md** for relationship type definitions
3. Follow naming convention: `ADR-XXX-kebab-case-title.md`
4. Update **CLAUDE.md** index after creating new ADR
5. Establish bidirectional relationships with related ADRs

## Maintenance Guidelines

- Update revision logs when modifying existing ADRs
- Maintain bidirectional hub-spoke references
- Use standardized relationship types from CLAUDE.md
- Keep implementation details in appendices
- Document state transitions (Adopted → Deprecated → Superseded)

## Contact

For questions about architecture decisions, refer to the ADR documents or contact the technical architecture team.
