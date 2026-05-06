# Ethara PM - Project Management App

A professional-grade web application for teams to manage projects and track tasks with role-based access control. Built on the MERN stack (MongoDB, Express, React, Node.js).

![Hero Image](https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&q=80&w=1200)

## 🚀 Features

- **Authentication & RBAC:** Secure JWT-based login with distinct "Admin" and "Member" roles.
- **Project Management:** Create projects, set deadlines, and manage team members.
- **Task Kanban Board:** Interactive task board to move tasks between Todo, In Progress, In Review, and Done.
- **Dashboard:** At-a-glance analytics with charts highlighting completed, active, and overdue tasks.
- **Modern UI:** Premium glassmorphism design with a dark mode aesthetic and responsive layout.

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router, Chart.js, Lucide Icons, pure CSS design system.
- **Backend:** Node.js, Express 5.
- **Database:** MongoDB via Mongoose.
- **Security:** bcryptjs (password hashing), jsonwebtoken (auth tokens), express-validator (input validation).

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas URI)

## 🏃‍♂️ How to Run the Project Locally

The project is split into a `backend` and `frontend`. You will need to run both simultaneously.

### 1. Start the Backend

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Ensure your `.env` file is set up. A basic configuration is provided in the repository (connected to local MongoDB by default). If you want to use a cloud database, change the `MONGO_URI` in `backend/.env`.

Start the development server:
```bash
npm run dev
```
The backend will run on `http://localhost:5000`.

### 2. Start the Frontend

Open a **new** terminal window and navigate to the `frontend` folder:

```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the React application:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or `5174` if `5173` is busy). Open this URL in your browser.

## 👨‍💻 Usage & Testing

1. Go to the web app in your browser and click **Create one** to register.
2. For testing full capabilities, select the **Admin** role during sign up.
3. Once logged in, navigate to **Projects** and create your first project.
4. Add tasks to your project and explore the Kanban board and Dashboard stats!
