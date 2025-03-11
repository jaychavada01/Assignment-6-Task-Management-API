# Task Management API

## 📌 Project Overview

This **Task Management API** is a backend service built using **Node.js, Express, and Sequelize** for managing user tasks. It provides features such as user authentication, task CRUD operations, filtering, sorting, and notifications for due dates.

## 🚀 Features

### **User Authentication**

- User Registration & Login
- Password Reset & Change Password
- JWT-based Authentication

### **Task Management**

- **Create, Read, Update, and Delete (CRUD) Tasks**
- Assign categories (Work, Personal)
- Set priority levels (High, Medium, Low)
- Mark tasks as **completed/uncompleted**

### **Task Filtering & Sorting**

- **Filter tasks** by status, category, or priority
- **Sort tasks** by due date, priority, or creation date

<!-- ### **Due Date & Alerts**
- Set due dates for tasks
- Receive overdue task notifications -->

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** JWT (JSON Web Tokens)
<!-- - **Notifications:** Firebase Cloud Messaging (FCM) -->

## 📂 Project Structure

```
Assignment 6/
├─ api/
│  ├─ config/
│  │  ├─ constant.js          # Stores status codes & constants
│  │  └─ database.js          # Database connection setup
│  ├─ controllers/
│  │  ├─ taskController.js    # Task CRUD operations
│  │  └─ userController.js    # User authentication & profile
│  ├─ middleware/
│  │  └─ auth.js              # Authentication middleware
│  ├─ models/
│  │  ├─ task.js              # Task model definition
│  │  └─ user.js              # User model definition
│  ├─ routes/
│  │  ├─ taskRoute.js         # Task API routes
│  │  └─ userRoute.js         # User authentication routes
│  ├─ utils/
│  │  └─ mailer.js            # Email handling utility
│  ├─ .env                    # Environment variables
│  ├─ app.js                  # Main application entry point
│  ├─ package-lock.json
│  └─ package.json
├─ .gitignore                 # Ignore files for Git
└─ readme.md                  # Project Documentation
```

## ⚡ Installation & Setup

### 1️⃣ **Clone the Repository**

```sh
git clone https://github.com/your-repo/task-management-api.git
cd task-management-api
```

### 2️⃣ **Install Dependencies**

```sh
npm install
```

### 3️⃣ **Set Up Environment Variables**

Create a `.env` file in the root directory and add the following:

```
PORT=3000
JWT_SECRET=your_jwt_secret

#DB CREDENTIALS
DB_NAME=your_db_name
DB_USER=your_user
DB_PASSWORD=your_pass
DB_HOST=localhost
DB_DIALECT=postgres

# MAILTRAP CREDENTIALS
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
```

### 4️⃣ **Start the Server**

```sh
npm run server
```

The API will be running at `http://localhost:3000`

## 🔥 API Endpoints

### **User Authentication**

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| POST   | `/api/users/signup`          | Register a new user    |
| POST   | `/api/users/login`           | Login user & get token |
| POST   | `/api/users/logout`          | Logout user            |
| POST   | `/api/users/reset-password`  | Reset password         |
| POST   | `/api/users/change-password` | Change password        |
| POST   | `/api/users/forget-password` | Forget password        |

### **Task Management**

| Method | Endpoint            | Description             |
| ------ | ------------------- | ----------------------- |
| POST   | `/api/tasks/create` | Create a new task       |
| GET    | `/api/tasks/get`    | Get all tasks of user   |
| GET    | `/api/tasks/:id`    | Get a single task by ID |
| PUT    | `/api/tasks/:id`    | Update task details     |
| DELETE | `/api/tasks/:id`    | Delete a task           |

## 🛡️ Security Measures

- **JWT-based authentication** for secure API access
- **Token blacklisting** for enhanced security
- **Password hashing** with bcrypt
