const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Configure Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && 
    GOOGLE_CLIENT_ID !== 'your_client_id_here' && 
    GOOGLE_CLIENT_SECRET !== 'your_client_secret_here') {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`;
  
  console.log('✅ Google OAuth configured');
  console.log('   Callback URL:', callbackURL);
  
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const { id, displayName, emails, photos } = profile;
      const email = emails[0].value;
      const profilePicture = photos[0]?.value;

      // Check if user exists by Google ID
      let [users] = await db.execute(
        'SELECT id, username, email FROM users WHERE google_id = ?',
        [id]
      );

      if (users.length > 0) {
        return done(null, users[0]);
      }

      // Check if user exists by email
      [users] = await db.execute(
        'SELECT id, username, email FROM users WHERE email = ?',
        [email]
      );

      if (users.length > 0) {
        // Update existing user with Google ID
        await db.execute(
          'UPDATE users SET google_id = ?, profile_picture = ? WHERE id = ?',
          [id, profilePicture, users[0].id]
        );
        return done(null, users[0]);
      }

      // Create new user
      const username = displayName || email.split('@')[0];
      const [result] = await db.execute(
        'INSERT INTO users (username, email, google_id, profile_picture) VALUES (?, ?, ?, ?)',
        [username, email, id, profilePicture]
      );

      const newUser = {
        id: result.insertId,
        username: username,
        email: email
      };

      return done(null, newUser);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // Google OAuth Routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3000/login?error=authentication_failed' }),
    async (req, res) => {
      try {
        const user = req.user;
        
        if (!user) {
          return res.redirect('http://localhost:3000/login?error=user_not_found');
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET
        );

        // Redirect to frontend with token
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/auth/callback?token=${token}&userId=${user.id}&username=${encodeURIComponent(user.username || '')}&email=${encodeURIComponent(user.email || '')}`);
      } catch (error) {
        console.error('Google callback error:', error);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/login?error=authentication_failed`);
      }
    }
  );
} else {
  console.warn('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
  console.warn('   Google login button will not work until credentials are set up.');
  
  // Add routes that return helpful error messages
  app.get('/api/auth/google', (req, res) => {
    res.status(400).json({ 
      error: 'Google OAuth not configured',
      message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env file. See GOOGLE_OAUTH_SETUP.md for instructions.'
    });
  });
  
  app.get('/api/auth/google/callback', (req, res) => {
    res.redirect('http://localhost:3000/login?error=oauth_not_configured');
  });
}

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const userId = result.insertId;

    // Generate token
    const token = jwt.sign({ id: userId, username: username }, JWT_SECRET);

    res.json({
      token,
      user: { id: userId, username: username, email: email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users] = await db.execute(
      'SELECT id, username, email, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Room Routes
app.get('/api/rooms', async (req, res) => {
  try {
    const [rooms] = await db.execute(`
      SELECT 
        r.id,
        r.name,
        r.created_by as createdBy,
        r.created_at as createdAt,
        COUNT(DISTINCT m.id) as messageCount,
        COUNT(DISTINCT rm.user_id) as memberCount,
        u.username as creatorUsername,
        (
          SELECT m2.message 
          FROM messages m2 
          WHERE m2.room_id = r.id 
          ORDER BY m2.created_at DESC 
          LIMIT 1
        ) as lastMessage,
        (
          SELECT m2.created_at 
          FROM messages m2 
          WHERE m2.room_id = r.id 
          ORDER BY m2.created_at DESC 
          LIMIT 1
        ) as lastMessageTime
      FROM rooms r
      LEFT JOIN messages m ON r.id = m.room_id
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN users u ON r.created_by = u.id
      GROUP BY r.id, r.name, r.created_by, r.created_at, u.username
      ORDER BY COALESCE((
        SELECT m2.created_at 
        FROM messages m2 
        WHERE m2.room_id = r.id 
        ORDER BY m2.created_at DESC 
        LIMIT 1
      ), r.created_at) DESC
    `);

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Check if room exists
    const [existingRooms] = await db.execute(
      'SELECT id FROM rooms WHERE LOWER(name) = LOWER(?)',
      [name.trim()]
    );

    if (existingRooms.length > 0) {
      return res.status(400).json({ error: 'Room already exists' });
    }

    // Create room
    const [result] = await db.execute(
      'INSERT INTO rooms (name, created_by) VALUES (?, ?)',
      [name.trim(), decoded.id]
    );

    const roomId = result.insertId;

    // Get the created room
    const [rooms] = await db.execute(
      'SELECT id, name, created_by as createdBy, created_at as createdAt FROM rooms WHERE id = ?',
      [roomId]
    );

    res.json(rooms[0]);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { roomId } = req.params;

    // Check if room exists and user is the creator
    const [rooms] = await db.execute(
      'SELECT created_by FROM rooms WHERE id = ?',
      [roomId]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (rooms[0].created_by !== decoded.id) {
      return res.status(403).json({ error: 'Only room creator can delete the room' });
    }

    // Delete room (messages will be cascade deleted due to foreign key)
    await db.execute('DELETE FROM rooms WHERE id = ?', [roomId]);

    // Notify all users in the room
    io.to(roomId).emit('room-deleted', { roomId });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const [messages] = await db.execute(
      `SELECT 
        m.id,
        m.room_id as roomId,
        m.user_id as userId,
        u.username,
        m.message,
        m.created_at as createdAt
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at ASC`,
      [roomId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/rooms/:roomId/users', async (req, res) => {
  try {
    const { roomId } = req.params;
    const [users] = await db.execute(
      `SELECT 
        u.id,
        u.username,
        rm.joined_at as joinedAt
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ?
      ORDER BY rm.joined_at ASC`,
      [roomId]
    );

    res.json(users);
  } catch (error) {
    console.error('Get room users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async ({ roomId, token }) => {
    const decoded = verifyToken(token);
    if (!decoded) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    socket.join(roomId);

    // Add user to room_members if not already there
    try {
      await db.execute(
        'INSERT IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)',
        [roomId, decoded.id]
      );

      // Get user info for broadcasting
      const [users] = await db.execute(
        'SELECT id, username FROM users WHERE id = ?',
        [decoded.id]
      );

      if (users.length > 0) {
        const userInfo = {
          id: users[0].id,
          username: users[0].username
        };

        // Broadcast user joined to all users in the room
        io.to(roomId).emit('user-joined', userInfo);

        // Send current room users to the newly joined user
        const [roomUsers] = await db.execute(
          `SELECT 
            u.id,
            u.username,
            rm.joined_at as joinedAt
          FROM room_members rm
          JOIN users u ON rm.user_id = u.id
          WHERE rm.room_id = ?
          ORDER BY rm.joined_at ASC`,
          [roomId]
        );
        socket.emit('room-users', roomUsers);
      }
    } catch (error) {
      console.error('Error adding room member:', error);
    }

    socket.emit('joined-room', { roomId });

    // Send room messages to the user
    try {
      const [messages] = await db.execute(
        `SELECT 
          m.id,
          m.room_id as roomId,
          m.user_id as userId,
          u.username,
          m.message,
          m.created_at as createdAt
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ?
        ORDER BY m.created_at ASC`,
        [roomId]
      );
      socket.emit('room-messages', messages);
    } catch (error) {
      console.error('Error fetching room messages:', error);
    }
  });

  socket.on('leave-room', async ({ roomId, token }) => {
    const decoded = verifyToken(token);
    if (decoded) {
      // Get user info before leaving
      try {
        const [users] = await db.execute(
          'SELECT id, username FROM users WHERE id = ?',
          [decoded.id]
        );

        if (users.length > 0) {
          const userInfo = {
            id: users[0].id,
            username: users[0].username
          };

          // Broadcast user left to all users in the room
          io.to(roomId).emit('user-left', userInfo);
        }
      } catch (error) {
        console.error('Error getting user info on leave:', error);
      }
    }

    socket.leave(roomId);
    socket.emit('left-room', { roomId });
  });

  socket.on('send-message', async ({ roomId, message, token }) => {
    const decoded = verifyToken(token);
    if (!decoded) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      // Get user info
      const [users] = await db.execute(
        'SELECT id, username FROM users WHERE id = ?',
        [decoded.id]
      );

      if (users.length === 0) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      const user = users[0];

      // Insert message into database
      const [result] = await db.execute(
        'INSERT INTO messages (room_id, user_id, message) VALUES (?, ?, ?)',
        [roomId, user.id, message.trim()]
      );

      const newMessage = {
        id: result.insertId,
        roomId: parseInt(roomId),
        userId: user.id,
        username: user.username,
        message: message.trim(),
        createdAt: new Date()
      };

      // Broadcast to all users in the room
      io.to(roomId).emit('new-message', newMessage);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    // Note: We could track which rooms the user was in and broadcast their leave
    // For now, we'll rely on the explicit leave-room event
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
