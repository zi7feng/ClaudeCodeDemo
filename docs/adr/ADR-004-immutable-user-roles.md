# ADR-004: Immutable User Roles

## Revision Log
| Date | Description |
|------|-------------|
| 2025-12-10 | Document created |
| 2025-12-10 | Consolidated by ADR-005 |

## Part of: ADR-005 (Technology Stack Selection)

## Context
The PRD specifies that users select their role during registration (e.g., buyer, seller, trader) and this role determines their platform permissions and features. The system needs a clear policy for role management post-registration.

## Decision
We implement user roles as immutable after registration. The User table's role field has no update interface and is written only once during account creation.

## Consequences

### Benefits
- Simplified permission model with guaranteed role consistency
- Prevents users from maliciously switching roles to access unauthorized features
- Data consistency ensured across all user-related records and relationships
- Eliminates complex role change validation and migration logic
- Audit trail simplification as role never changes

### Tradeoffs
- Users requiring role change must create a new account
- No flexibility for users who genuinely need different capabilities
- Potential user frustration if initial role selection was incorrect
- Data migration complexity if user wants to preserve historical data
- Customer support burden for role change requests

## Implementation
1. Define role field in User model as non-nullable with default constraint
2. Include role selection in registration form with clear descriptions
3. Persist role during user creation in database INSERT operation
4. Explicitly exclude role field from all UPDATE endpoints
5. Implement role-based access control (RBAC) using session-stored role
6. Document role immutability in user documentation

## Related Decisions
- **Depends on**: ADR-002 - Session-Based Authentication (role stored in session)
- **Consolidated by**: ADR-005 - Technology Stack Selection

## Future Considerations
If role flexibility becomes critical business requirement, consider implementing role change workflow with administrative approval, data migration, and comprehensive audit logging rather than simple field updates.

## Appendix: User Model Schema

```python
# backend/models/user.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Role is immutable after creation
    role = db.Column(
        db.Enum('buyer', 'seller', 'trader', name='user_roles'),
        nullable=False
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username} ({self.role})>'

    def to_dict(self):
        """Serialize user for API responses."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }
```

## Appendix: Registration Endpoint

```python
# backend/api/user.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from models import db, User

user_bp = Blueprint('user', __name__)

VALID_ROLES = ['buyer', 'seller', 'trader']

@user_bp.route('/api/user/register', methods=['POST'])
def register():
    """
    Register new user with immutable role selection.
    """
    data = request.get_json()

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    # Validation
    if not all([username, email, password, role]):
        return jsonify({'error': 'All fields required'}), 400

    if role not in VALID_ROLES:
        return jsonify({
            'error': f'Invalid role. Must be one of: {", ".join(VALID_ROLES)}'
        }), 400

    # Check if user exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Create user with immutable role
    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        role=role  # Set once during creation, never updated
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'user': new_user.to_dict(),
        'message': f'Account created as {role}. Role cannot be changed.'
    }), 201

@user_bp.route('/api/user/profile', methods=['PUT'])
def update_profile():
    """
    Update user profile (excluding role).
    """
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401

    user_id = session['user_id']
    data = request.get_json()

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Explicitly block role updates
    if 'role' in data:
        return jsonify({
            'error': 'Role cannot be changed after registration'
        }), 403

    # Allow updates to other fields
    if 'email' in data:
        user.email = data['email']

    # Note: username typically also immutable in most systems
    # Password changes should use separate endpoint with current password verification

    db.session.commit()

    return jsonify({
        'status': 'success',
        'user': user.to_dict()
    }), 200
```

## Appendix: Frontend Registration Form

```javascript
// frontend/src/components/RegistrationForm.jsx
import React, { useState } from 'react';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import axios from 'axios';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: ''
  });
  const [error, setError] = useState('');

  const roles = [
    { value: 'buyer', label: 'Buyer - Purchase weight-based stocks' },
    { value: 'seller', label: 'Seller - Sell weight-based stocks' },
    { value: 'trader', label: 'Trader - Buy and sell stocks' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/user/register', formData);

      if (response.data.status === 'success') {
        alert('Registration successful! Your role cannot be changed later.');
        // Redirect to login
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Username"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
        required
        fullWidth
      />

      <TextField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
        fullWidth
      />

      <TextField
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
        fullWidth
      />

      <FormControl fullWidth required>
        <InputLabel>Role</InputLabel>
        <Select
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          {roles.map(role => (
            <MenuItem key={role.value} value={role.value}>
              {role.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Alert severity="warning">
        Your selected role cannot be changed after registration. Choose carefully.
      </Alert>

      {error && <Alert severity="error">{error}</Alert>}

      <Button type="submit" variant="contained" color="primary">
        Register
      </Button>
    </form>
  );
};

export default RegistrationForm;
```
