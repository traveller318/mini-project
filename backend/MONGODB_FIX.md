# 🔧 MongoDB Connection Fix Guide

## Current Issue
Authentication failed - The username/password combination is not working.

## Solution Steps

### Step 1: Go to MongoDB Atlas
1. Visit https://cloud.mongodb.com
2. Log in to your account

### Step 2: Create/Update Database User
1. Click on **Database Access** in the left sidebar
2. Click **"+ ADD NEW DATABASE USER"** or edit existing user
3. Choose **"Password"** authentication method
4. Set Username: `harshalshahhss` (or choose a new one)
5. Set Password: **Create a STRONG password** (avoid special characters like @, #, /, etc. for easier URL encoding)
6. Select **"Built-in Role"**: **Read and write to any database**
7. Click **"Add User"** or **"Update User"**

### Step 3: Whitelist Your IP Address
1. Click on **Network Access** in the left sidebar
2. Click **"+ ADD IP ADDRESS"**
3. Option A: Click **"ALLOW ACCESS FROM ANYWHERE"** (easier for development)
   - This adds `0.0.0.0/0` which allows all IPs
4. Option B: Add your current IP address specifically
5. Click **"Confirm"**

### Step 4: Get the Correct Connection String
1. Click on **Database** (or **Clusters**) in the left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select Driver: **Node.js** and Version: **4.1 or later**
5. Copy the connection string
6. It should look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Update Your .env File
1. Replace `<username>` with your actual username
2. Replace `<password>` with your actual password
3. Add the database name after `.net/` (e.g., `finance-tracker`)

Example:
```env
MONGODB_URL="mongodb+srv://harshalshahhss:YourNewPassword123@cluster0.rmdo0kf.mongodb.net/finance-tracker?retryWrites=true&w=majority"
```

### Step 6: URL Encode Special Characters (if needed)
If your password contains special characters, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `:` → `%3A`
- `/` → `%2F`

Example with special chars:
```
Password: MyP@ss#123
Encoded: MyP%40ss%23123
```

### Step 7: Test the Connection
1. Save the `.env` file
2. Stop the running server (if any): Press `Ctrl+C` in terminal
3. Restart the server:
   ```bash
   npm run dev
   ```
4. You should see:
   ```
   ✅ MongoDB Connected Successfully!
   📍 Host: cluster0-shard-00-00.xxxxx.mongodb.net
   🗄️  Database: finance-tracker
   ```

## Alternative: Use Local MongoDB

If you prefer local development:

1. Install MongoDB locally from https://www.mongodb.com/try/download/community
2. Update `.env`:
   ```env
   MONGODB_URL="mongodb://localhost:27017/finance-tracker"
   ```
3. Restart server

## Need Help?

Common Errors:
- ❌ **bad auth**: Wrong username/password
- ❌ **MongoNetworkError**: IP not whitelisted or network issue
- ❌ **MongoServerSelectionError**: Can't connect to cluster (check cluster status)

If issues persist:
1. Delete the user and create a new one with a simple password (only letters and numbers)
2. Make sure you're using the correct cluster
3. Wait a few minutes after creating user/IP whitelist (changes take time to propagate)
