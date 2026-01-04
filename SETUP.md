# Quick Setup Guide

## Database Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE chatapp;
   ```

2. **Import the schema:**
   - Open your MySQL admin tool (phpMyAdmin, MySQL Workbench, etc.)
   - Select the `chatapp` database
   - Import the file: `database/schema.sql`
   - Or use command line:
     ```bash
     mysql -u your_username -p chatapp < database/schema.sql
     ```

## Backend Configuration

1. **Create `.env` file in the `backend` folder:**
   ```
   PORT=5000
   JWT_SECRET=your-secret-key-change-in-production
   
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=chatapp
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

## Troubleshooting

- **Database connection error:** Make sure MySQL is running and your credentials in `.env` are correct
- **Can't see database in admin:** Make sure you've created the database and imported the schema
- **Registration/login not working:** Check that the database tables exist and your `.env` file has correct database credentials

