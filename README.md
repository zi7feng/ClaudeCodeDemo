# Weight Stock Platform 2.0

A gamified weight tracking platform where users can create "weight stocks" as sellers and trade them as buyers.

## Features

- **Sellers**: Input daily weight, automatically calculate price based on configured parameters, and upload prices
- **Buyers**: View seller charts, recharge balance, buy/sell weight stocks, track P&L
- **Charts**: Interactive price charts with MA5/10/20/50 moving averages
- **Internationalization**: Support for English and Chinese

## Tech Stack

### Backend
- Flask 3.0
- SQLAlchemy + MySQL 8.0
- Flask-Session for session management
- pandas for data analysis

### Frontend
- React 18 + TypeScript
- Vite build tool
- MUI (Material-UI) components
- Recharts for data visualization
- react-i18next for internationalization
- Axios for API calls

## Project Structure

```
ClaudeCodeDemo/
├── backend/
│   ├── app/
│   │   ├── __init__.py      # Flask app factory
│   │   ├── config.py        # Configuration
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middlewares/     # Auth decorators
│   │   └── utils/           # Utilities (security)
│   ├── run.py               # Entry point
│   ├── requirements.txt
│   └── init_db.sql          # Database schema
│
└── frontend/
    ├── src/
    │   ├── api/             # API client
    │   ├── components/      # React components
    │   ├── contexts/        # React contexts
    │   ├── pages/           # Page components
    │   ├── utils/           # Utilities
    │   ├── locales/         # i18n translations
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── theme.ts         # MUI theme
    ├── package.json
    └── vite.config.ts
```

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.0+

### Database Setup
```bash
mysql -u root -p < backend/init_db.sql
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run the server
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Seller
- `POST /seller/upload-price` - Upload calculated price
- `GET /seller/settings` - Get price calculation settings
- `PUT /seller/settings` - Update settings
- `GET /seller/prices` - Get own price history

### Prices
- `GET /prices/{sellerId}?period=1M` - Get seller price chart data
- `GET /prices/sellers` - Get all sellers with latest prices

### Buyer
- `POST /buyer/recharge` - Add funds to balance
- `POST /buyer/trade` - Execute buy/sell trade
- `GET /buyer/trades` - Get trade history
- `GET /buyer/balance` - Get current balance
- `GET /buyer/pnl/{sellerId}` - Get P&L for a seller position

## Price Calculation Formula

```
If W >= W0: price = P0 + (W - W0) * kUp
If W <  W0: price = P0 + (W - W0) * kDown

Where:
- W = current weight
- W0 = baseline weight
- P0 = base price
- kUp = slope when weight is above baseline
- kDown = slope when weight is below baseline
```

## Security

- Passwords hashed using SHA256(username + password + salt)
- Session cookies are HttpOnly
- All write operations require authentication
- SQLAlchemy ORM prevents SQL injection
- CORS configured for frontend domain

## License

MIT
