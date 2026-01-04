import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import './ChatRoom.css';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function ChatRoom({ token, user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [socket, setSocket] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Join room
    newSocket.emit('join-room', { roomId, token });

    // Listen for messages
    newSocket.on('room-messages', (roomMessages) => {
      setMessages(roomMessages);
    });

    newSocket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('room-users', (users) => {
      setRoomUsers(users);
    });

    newSocket.on('user-joined', (userInfo) => {
      setRoomUsers((prev) => {
        if (!prev.find(u => u.id === userInfo.id)) {
          return [...prev, userInfo];
        }
        return prev;
      });
    });

    newSocket.on('user-left', (userInfo) => {
      setRoomUsers((prev) => prev.filter(u => u.id !== userInfo.id));
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      if (error.message === 'Unauthorized') {
        navigate('/login');
      }
    });

    newSocket.on('room-deleted', ({ roomId: deletedRoomId }) => {
      if (deletedRoomId === roomId) {
        alert('This room has been deleted by the creator.');
        navigate('/rooms');
      }
    });

    // Fetch room info and users
    fetchRoomInfo();
    fetchRoomUsers();

    return () => {
      newSocket.emit('leave-room', { roomId, token });
      newSocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoomInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      const room = response.data.find(r => r.id === parseInt(roomId));
      if (room) {
        setRoomName(room.name);
      }
    } catch (err) {
      console.error('Failed to fetch room info:', err);
    }
  };

  const fetchRoomUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomId}/users`);
      setRoomUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch room users:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send-message', {
      roomId,
      message: newMessage,
      token
    });

    setNewMessage('');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-room-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <button onClick={() => navigate('/rooms')} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="chat-header-info">
            <h2>{roomName || `Room ${roomId}`}</h2>
            <span className="chat-header-subtitle">{roomUsers.length} {roomUsers.length === 1 ? 'member' : 'members'}</span>
          </div>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-messages-wrapper">
          <div className="chat-messages" ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <div className="no-messages">
                <div className="no-messages-icon">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.userId === user?.id ? 'message-own' : ''}`}
                >
                  <div className="message-header">
                    <span className="message-username">{message.username}</span>
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                  </div>
                  <div className="message-content">{message.message}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="chat-input"
              />
              <button type="submit" className="btn-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Members</h3>
            <span className="member-count">{roomUsers.length}</span>
          </div>
          <div className="user-list">
            {roomUsers.length === 0 ? (
              <div className="no-users">No members yet</div>
            ) : (
              roomUsers.map((roomUser) => (
                <div
                  key={roomUser.id}
                  className={`user-item ${roomUser.id === user?.id ? 'user-item-current' : ''}`}
                >
                  <div className="user-avatar">
                    {roomUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {roomUser.username}
                      {roomUser.id === user?.id && <span className="user-badge">You</span>}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;

