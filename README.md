# Operations Tracker - Construction Management System

A comprehensive web application for managing construction operations, built with React and Node.js.

## Features

### 1. User Management
- Admin can create, edit, and deactivate user accounts
- Role-based access control (Admin, Manager, Supervisor, Worker)
- Username and password authentication

### 2. Project & Site Management
- Create and manage construction projects
- Assign supervisors and teams to sites
- Update project/site details

### 3. Task & Activity Tracking
- Supervisors can create and assign tasks to workers
- Workers can log task progress and completion
- Track daily operations/activities on each site

### 4. Resource & Material Tracking
- Record material deliveries to sites
- Track material usage and automatically update balances
- Material requisition approval workflow

### 5. Equipment & Machinery Tracking
- Record equipment availability and usage
- Track equipment breakdowns and maintenance schedules
- Alerts for equipment requiring servicing

### 6. Attendance & Workforce Tracking
- Supervisors can mark daily attendance
- Track work hours for each employee
- Leave request and approval workflows

### 7. Reporting & Analytics
- Daily, weekly, and monthly progress reports
- Material usage, work progress, and equipment status reports
- Data visualization with charts and tables

### 8. Notifications & Alerts
- Alerts for overdue tasks
- Notifications for material shortages
- Equipment issues and delay notifications

### 9. File & Document Management
- Upload documents (site plans, permits, photos)
- Supervisors can upload daily site images
- Secure storage and retrieval

### 10. Audit Trail & Logs
- Record every change made by users
- Log material updates, task changes, and attendance modifications

## Tech Stack

- **Frontend**: React (Create React App), Tailwind CSS, React Router, Axios, Recharts
- **Backend**: Node.js, Express.js
- **Database**: Neon PostgreSQL
- **Hosting**: Vercel (Frontend & Backend)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database (Neon PostgreSQL recommended)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_neon_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

4. Set up the database:
   - Connect to your Neon PostgreSQL database
   - Run the SQL schema from `backend/database/schema.sql`

5. Seed the admin user:
```bash
node database/seed.js
```

6. Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Default Credentials

- **Username**: admin
- **Password**: admin123

**Important**: Change the default password after first login!

## Deployment

This application is designed to be deployed on Vercel with Neon PostgreSQL. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Set up Neon PostgreSQL:**
   - Create account at [neon.tech](https://neon.tech)
   - Create a new project
   - Run the schema from `backend/database/schema.sql`

2. **Deploy Backend to Vercel:**
   - Connect GitHub repository to Vercel
   - Set root directory to `backend`
   - Add environment variables (see DEPLOYMENT.md)

3. **Deploy Frontend to Vercel:**
   - Create another Vercel project
   - Set root directory to `frontend`
   - Add `REACT_APP_API_URL` environment variable

4. **Update Backend CORS:**
   - Set `FRONTEND_URL` in backend environment variables
   - Redeploy backend

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions.

## Project Structure

```
operations-tracker/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── materials.js
│   │   ├── equipment.js
│   │   ├── attendance.js
│   │   ├── reports.js
│   │   ├── notifications.js
│   │   ├── documents.js
│   │   └── audit.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── auditLogger.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── logo.svg
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Projects.js
│   │   │   ├── Tasks.js
│   │   │   ├── Materials.js
│   │   │   ├── Equipment.js
│   │   │   ├── Attendance.js
│   │   │   ├── Reports.js
│   │   │   ├── Documents.js
│   │   │   ├── Users.js
│   │   │   ├── Notifications.js
│   │   │   └── AuditLogs.js
│   │   ├── config/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## License

This project is licensed under the MIT License.

## Repository

**GitHub:** https://github.com/bvggies/operation-tracker

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/bvggies/operation-tracker/issues).

