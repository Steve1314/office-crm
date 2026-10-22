# Office CRM - Enterprise Full-Stack Architecture

An enterprise Office CRM solution built with a decoupled **Client & Server** architecture:
- **Client (`client/`)**: React 19 + Vite + Capacitor Android mobile app with high-priority FCM notification receiver, responsive desktop sidebar & mobile bottom navigation.
- **Server (`server/`)**: Node.js + Express + MongoDB + Firebase Admin SDK for background push notifications, recurring task reminders, and employee expense balance reconciliation.

## Task Reminders and Expense Tracking

- Employees can snooze a pending task for 5 minutes or complete it after attaching at least one proof image.
- The server sends a push reminder every 5 minutes while an assigned task remains pending. The server must stay online, the employee must have a registered FCM token, and Android notification permission/device notification settings must allow notifications. Android can restrict delivery if the user force-stops the app or disables notifications.
- Issued-money history is shown with each employee's gross issue, any deduction for previous overspending, and the net amount available for new expenses.
- Expense and settlement records are matched to the employee so one employee's overspend is not deducted from another employee's next issue.

---

## 📁 Project Directory Structure

```text
ofiice crm/
├── client/                     # Frontend & Mobile Application
│   ├── android/                # Native Android Studio Project (Package: com.task.app)
│   ├── public/                 # Static assets & icons
│   ├── src/                    # React components, features, styles, and services
│   ├── capacitor.config.json   # Capacitor configuration
│   ├── package.json            # Client dependencies & scripts
│   └── vite.config.js          # Vite build configuration
├── server/                     # Backend API & Push Service
│   ├── src/
│   │   ├── config/             # MongoDB & Firebase Admin initialization
│   │   ├── controllers/        # Tasks, Expenses, Auth controllers
│   │   ├── models/             # Mongoose Models (Task, Expense, User, Transaction)
│   │   ├── routes/             # API Endpoints
│   │   └── services/           # FCM Push Notification Service (High Priority / Alarm)
│   ├── firebase-admin.json     # Firebase Service Account Credentials
│   ├── package.json            # Server dependencies
│   └── .env                    # Environment variables (PORT, MONGO_URI, JWT_SECRET)
├── Office_CRM.apk              # Pre-built Native Android APK
└── package.json                # Root scripts to orchestrate client & server
```

---

## 🚀 Running the Application

### 1. Root Commands
From the project root:
- **Start Client**: `npm run client` (or `npm run dev`)
- **Start Server**: `npm run server`
- **Build Client**: `npm run client:build`

### 2. Running Client Standalone
```bash
cd client
npm run dev        # Starts Vite dev server on http://localhost:5173
npm run build      # Builds production assets to client/dist
npx cap sync       # Syncs web assets to native Android project
```

### 3. Running Server Standalone
```bash
cd server
npm run dev        # Starts Express server on http://localhost:5000 with nodemon
```
