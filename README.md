# Tail Treasures - React Version

A comprehensive Pet Care and Adoption platform built with React and Node.js.

## Project Structure

```
Project_with_React/
├── backend/          # Express REST API
│   ├── config/       # Database and authentication config
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth and upload middleware
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API endpoints
│   ├── uploads/      # User uploaded files
│   └── server.js     # Entry point
└── frontend/         # React application
    ├── public/       # Static files
    └── src/          # React components and logic
```

## Team Members & Roles

- **PEDDINENI BHASWANTH**: Database schemas, dashboard for all users, authentication files
- **AVULA LAKSHMI NARASIMHA REDDY**: Pets, adoption pages and admin side acceptance
- **SOMAROUTHU NAGA SAI PRAVEEN**: Products page, Seller features and reverse feedback control
- **SOMESWARKUMAR BALAM**: Veterinary pages, appointments, Doctor side acceptance
- **RAYAPU NISHANTH**: Login, Registration, Home, About pages and relevant CSS

## Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local instance or cloud URI)

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file with:

   ```
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   PORT=5000
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file with:

   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the React app:
   ```bash
   npm start
   ```

## Running the Application

1. Start backend server (runs on http://localhost:5000)
2. Start frontend app (runs on http://localhost:3000)
3. Access the application at http://localhost:3000

## Features

- User authentication with role-based access (Customer, Seller, Veterinary, Admin)
- Pet adoption system with application workflow
- E-commerce for pet products
- Veterinary appointment booking
- Seller and admin dashboards
- Order management and tracking

## Technology Stack

### Backend

- Node.js & Express.js
- MongoDB with Mongoose
- Passport.js for authentication
- Multer for file uploads
- Express-session for session management

### Frontend

- React.js
- React Router for navigation
- Axios for API calls
- Bootstrap for styling
- Context API for state management

## License

This project is developed as part of academic coursework.
