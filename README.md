# Room-Based Chat Application

A real-time chat application built with React, Express, and Socket.io. Currently uses in-memory storage, but includes SQL schema for future MySQL integration.

## Features

- User registration and authentication
- Room creation and joining
- Real-time messaging with Socket.io
- Minimal, clean UI design
- JWT-based authentication

## Tech Stack

- **Frontend**: React, React Router, Socket.io-client, Axios
- **Backend**: Express.js, Socket.io, JWT, bcryptjs, mysql2
- **Database**: MySQL

## Project Structure

```
chatapp3.0/
├── backend/
│   ├── server.js          # Express server with Socket.io
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── RoomList.js
│   │   │   └── ChatRoom.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── database/
│   └── schema.sql         # MySQL database schema
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MySQL (for future database integration)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
PORT=5000
JWT_SECRET=your-secret-key-change-in-production

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chatapp
```

4. Set up MySQL database:
   - Create the database:
   ```sql
   CREATE DATABASE chatapp;
   ```
   - Run the schema file:
   ```bash
   mysql -u your_username -p chatapp < ../database/schema.sql
   ```
   Or import the schema.sql file through your MySQL admin tool (phpMyAdmin, MySQL Workbench, etc.)

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE chatapp;
```

2. Run the schema file:
```bash
mysql -u your_username -p chatapp < database/schema.sql
```

Or import the `database/schema.sql` file through your MySQL admin tool (phpMyAdmin, MySQL Workbench, etc.)

3. Update the `.env` file with your database credentials (see step 3 of Backend Setup above).

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create a new room (requires authentication)
- `DELETE /api/rooms/:roomId` - Delete a room (only room creator)
- `GET /api/rooms/:roomId/messages` - Get messages for a room

### WebSocket Events

**Client to Server:**
- `join-room` - Join a room
- `leave-room` - Leave a room
- `send-message` - Send a message to a room

**Server to Client:**
- `joined-room` - Confirmation of joining a room
- `left-room` - Confirmation of leaving a room
- `room-messages` - Initial room messages
- `new-message` - New message broadcast
- `error` - Error messages

## Usage

1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Register a new account or login
4. Create a new room or join an existing one
5. Start chatting in real-time!

## Notes

- Uses MySQL database for data persistence
- JWT tokens are stored in localStorage
- Socket.io connection requires valid JWT token
- All passwords are hashed using bcryptjs
- Room creators can delete their rooms (deletes all messages in the room)
- Real-time notifications when rooms are deleted

