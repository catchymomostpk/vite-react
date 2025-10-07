# MongoDB Atlas Setup Guide for Chai-Fi

## Step-by-Step MongoDB Atlas Configuration

### 1. Account Creation
1. Visit https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"**
3. Sign up with email or Google/GitHub account
4. Verify your email address

### 2. Create Your First Cluster

#### Choose Cloud Provider & Region
1. Select **"Shared Clusters"** (Free Tier)
2. Choose **Cloud Provider**: AWS (recommended)
3. Select **Region**: Closest to your users
4. Keep default cluster name or rename to `chai-fi-cluster`

#### Cluster Configuration
- **Cluster Tier**: M0 Sandbox (Free Forever)
- **Additional Settings**: Leave defaults
- **Cluster Name**: `chai-fi-cluster`
- Click **"Create Cluster"**

⏱️ **Wait Time**: 3-5 minutes for cluster creation

### 3. Database Access Configuration

#### Create Database User
1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `chai-fi-admin`
5. **Password**: Click "Autogenerate Secure Password" or create your own
   - ⚠️ **Save this password securely!**
6. **Database User Privileges**: 
   - Select **"Read and write to any database"**
7. Click **"Add User"**

#### User Configuration Example
