# Finance Tracker Backend API

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env` (if needed)
   - Update the MongoDB connection string in `.env`

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm start
```

## 📝 MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster

2. **Create Database User**
   - Go to Database Access
   - Click "Add New Database User"
   - Set username and password
   - Grant "Read and Write to any database" permissions

3. **Whitelist IP Address**
   - Go to Network Access
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Or add your specific IP address

4. **Get Connection String**
   - Go to Databases → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Add database name after `.net/` (e.g., `finance-tracker`)

5. **Update .env file**
```env
MONGODB_URL="mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/finance-tracker?retryWrites=true&w=majority"
```

### Option 2: Local MongoDB

```env
MONGODB_URL="mongodb://localhost:27017/finance-tracker"
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URL="your_mongodb_connection_string"

# Server
PORT=5000
NODE_ENV=development

# Frontend (for CORS)
FRONTEND_URL=http://localhost:8081

# JWT (will be used later)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/             # Route controllers
├── middleware/              # Custom middleware
├── models/                  # Mongoose models
│   ├── User.js
│   ├── Transaction.js
│   ├── Budget.js
│   ├── SavingGoal.js
│   ├── Subscription.js
│   ├── Notification.js
│   ├── VoiceInteraction.js
│   └── InvestmentRecommendation.js
├── routes/                  # API routes
├── uploads/                 # File uploads
├── utils/                   # Utility functions
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── server.js                # Entry point
```

## 🛣️ API Endpoints (To be implemented)

### Health Check
- `GET /health` - Server health check
- `GET /` - API welcome message

### Authentication (Coming Soon)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/password` - Change password

### Transactions
- `GET /api/v1/transactions` - Get all transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/:id` - Get single transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

### Budgets
- `GET /api/v1/budgets` - Get all budgets
- `POST /api/v1/budgets` - Create budget
- `GET /api/v1/budgets/:id` - Get single budget
- `PUT /api/v1/budgets/:id` - Update budget
- `DELETE /api/v1/budgets/:id` - Delete budget

### Saving Goals
- `GET /api/v1/goals` - Get all goals
- `POST /api/v1/goals` - Create goal
- `GET /api/v1/goals/:id` - Get single goal
- `PUT /api/v1/goals/:id` - Update goal
- `DELETE /api/v1/goals/:id` - Delete goal

### Subscriptions
- `GET /api/v1/subscriptions` - Get all subscriptions
- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/subscriptions/:id` - Get single subscription
- `PUT /api/v1/subscriptions/:id` - Update subscription
- `DELETE /api/v1/subscriptions/:id` - Delete subscription

### Notifications
- `GET /api/v1/notifications` - Get all notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Investment Recommendations
- `GET /api/v1/investments` - Get recommendations
- `POST /api/v1/investments/generate` - Generate new recommendations

### Voice Interactions
- `POST /api/v1/voice/process` - Process voice input
- `GET /api/v1/voice/history` - Get interaction history

## 🐛 Troubleshooting

### MongoDB Connection Issues

1. **Authentication Failed**
   - Verify username and password in connection string
   - Check if user has proper permissions in MongoDB Atlas

2. **Network Error**
   - Verify IP address is whitelisted in MongoDB Atlas
   - Check firewall settings

3. **Connection Timeout**
   - Check if MongoDB cluster is running
   - Verify connection string format

### Port Already in Use

```bash
# Windows - Find and kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## 📚 Technologies Used

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

## 🔒 Security Features

- Helmet for security headers
- CORS configuration
- JWT authentication (to be implemented)
- Password hashing with bcryptjs
- Input validation with Mongoose
- Environment variable protection

## 📝 Next Steps

1. ✅ Basic server setup
2. ✅ MongoDB connection
3. ✅ Model schemas defined
4. ⏳ Implement authentication middleware
5. ⏳ Create route handlers
6. ⏳ Implement controllers
7. ⏳ Add input validation
8. ⏳ Error handling
9. ⏳ Testing
10. ⏳ Documentation

## 📄 License

ISC
