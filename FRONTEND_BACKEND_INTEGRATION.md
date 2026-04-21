# Frontend-Backend Google Fit Integration Guide

## ✅ What's Been Implemented

### Backend (Complete)
- ✅ Google OAuth 2.0 authentication
- ✅ Automatic token refresh
- ✅ Fetches all health data (steps, calories, heart points, distance, activities)
- ✅ Automatic sync every 15 minutes
- ✅ Real-time Socket.IO updates
- ✅ MongoDB connected

### Frontend (Complete)
- ✅ OAuth flow integration
- ✅ JWT token management
- ✅ Display Google Fit data in Dashboard
- ✅ Real-time calories burned in "Daily Calorie Balance"
- ✅ Steps, distance, heart points display
- ✅ Connect Google Fit button
- ✅ Auto-refresh functionality

## 🚀 How to Use

### 1. Start Backend
```powershell
cd "d:\NutriTrack AI\nutritrack-ai\backend"
npm run dev
```

Should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
⏰ Sync job scheduled: Every 15 minutes
```

### 2. Start Frontend
```powershell
cd "d:\NutriTrack AI\nutritrack-ai\frontend"
npm run dev
```

### 3. Connect Google Fit
1. Open frontend in browser (usually http://localhost:5173)
2. You'll see "Connect Google Fit" button in the fitness section
3. Click it → redirected to Google OAuth
4. Grant permissions
5. Redirected back with your fitness data!

## 📊 Data Flow

```
1. User clicks "Connect Google Fit"
   ↓
2. Frontend requests OAuth URL from backend
   ↓
3. User redirected to Google → grants permissions
   ↓
4. Google redirects to backend → exchanges code for tokens
   ↓
5. Backend stores tokens in MongoDB
   ↓
6. Backend generates JWT → redirects to frontend with token
   ↓
7. Frontend stores JWT → fetches fitness data
   ↓
8. Dashboard displays:
   - Calories Burned (updates "Daily Calorie Balance")
   - Steps
   - Distance
   - Heart Points
   - Activities
   ↓
9. Every 15 minutes: Backend auto-syncs new data
   ↓
10. Frontend can manually refresh anytime
```

## 💡 Features in Your Dashboard

### Daily Calorie Balance Card
- **Calories Burned**: Auto-updates from Google Fit
- **Net Calories**: Consumed - Burned
- **Remaining**: Goal - Net
- **Progress Bar**: Visual completion percentage

### Fitness Activity Section
- Shows real-time data from Google Fit
- Displays:
  - 👟 Steps
  - 🔥 Calories Burned
  - 📍 Distance (km)
  - ❤️ Heart Points
  - 🏃 Activities (workouts)
- "Refresh" button to manually sync
- Connection status indicator

## 🔄 Real-Time Updates (Optional)

To enable Socket.IO for instant updates when backend syncs:

```powershell
cd "d:\NutriTrack AI\nutritrack-ai\frontend"
npm install socket.io-client
```

Then the data will update automatically every 15 minutes without manual refresh!

## 🧪 Testing

### Test Backend Endpoints
```powershell
# Test server
curl http://localhost:5000/ping

# Get OAuth URL
curl http://localhost:5000/api/auth/google/url

# Get fitness data (after connecting)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/fitness/today
```

### Test Frontend
1. Open browser console (F12)
2. Connect Google Fit
3. Watch for logs:
   - ✅ Google Fit data loaded
   - Token stored
   - Data displayed

## 📝 Current Setup

### Environment Variables (.env)
```
MONGO_URI=mongodb+srv://ummara:Ummara7860%23@nutriapp...
GOOGLE_CLIENT_ID=723261830182-f22d9ac8trvnjbia2emr1flkgkt5edd8...
GOOGLE_CLIENT_SECRET=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
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:5000
```

### API Endpoints Available
- `GET /api/auth/google/url` - Get OAuth URL
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/fitness/today` - Last 24h data
- `GET /api/fitness/hourly` - Hourly breakdown
- `GET /api/fitness/activities` - Activities list
- `POST /api/fitness/sync` - Manual sync
- `GET /api/user/profile` - User profile

## 🎯 What Happens Now

1. **Automatic Syncing**: Every 15 minutes, backend fetches new data from Google Fit
2. **Calories Update**: Your "Calories Burned" automatically updates
3. **Charts Update**: All fitness metrics update with real data
4. **No Manual Work**: Once connected, everything is automatic!

## 🔧 Troubleshooting

### "Not connected to Google Fit yet"
- Click the "Connect Google Fit" button
- Make sure backend is running

### Data not showing
- Check browser console for errors
- Verify JWT token is stored: `localStorage.getItem('jwt')`
- Click "Refresh" button
- Make sure you have data in Google Fit app

### Backend errors
- Ensure MongoDB is connected
- Check Google OAuth credentials are correct
- Verify Fitness API is enabled in Google Cloud

## ✨ Success Indicators

You'll know it's working when you see:
- ✅ "Synced with Google Fit" at bottom of fitness section
- 🔥 Real calorie values (not 0)
- 👟 Your actual step count
- 📍 Distance you've traveled
- 🏃 Your workout activities listed

## 🎉 You're All Set!

Your app now:
- Automatically tracks your fitness
- Updates calories burned in real-time
- Syncs with Google Fit every 15 minutes
- Shows all your health metrics
- No manual refresh needed!

