import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './RoomList.css';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function RoomList({ token, user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    
    // Set up socket connection for room deletion events
    const socket = io(SOCKET_URL);
    
    socket.on('room-deleted', ({ roomId }) => {
      setRooms(prevRooms => prevRooms.filter(room => room.id !== parseInt(roomId)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/rooms`,
        { name: newRoomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRoomName('');
      fetchRooms();
      navigate(`/room/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this room? All messages will be permanently deleted.')) {
      return;
    }

    setDeletingRoom(roomId);
    try {
      await axios.delete(
        `${API_URL}/rooms/${roomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room');
    } finally {
      setDeletingRoom(null);
    }
  };

  return (
    <div className="room-list-container">
      <div className="room-list-header">
        <div>
          <h1>Chat Rooms</h1>
          <p>Welcome, {user?.username}</p>
        </div>
        <button onClick={onLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      <div className="container">
        <div className="card">
          <h2>Create New Room</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleCreateRoom}>
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="input"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Available Rooms</h2>
          {rooms.length === 0 ? (
            <p>No rooms available. Create one to get started!</p>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => {
                const getRoomIcon = (name) => {
                  const icons = ['💬', '🎮', '🎨', '📚', '🎵', '🏠', '🌍', '⚡', '🔥', '💡'];
                  const index = name.charCodeAt(0) % icons.length;
                  return icons[index];
                };

                const formatLastMessage = (message) => {
                  if (!message) return 'No messages yet';
                  return message.length > 50 ? message.substring(0, 50) + '...' : message;
                };

                const formatTime = (dateString) => {
                  if (!dateString) return '';
                  const date = new Date(dateString);
                  const now = new Date();
                  const diff = now - date;
                  const minutes = Math.floor(diff / 60000);
                  const hours = Math.floor(diff / 3600000);
                  const days = Math.floor(diff / 86400000);

                  if (minutes < 1) return 'Just now';
                  if (minutes < 60) return `${minutes}m ago`;
                  if (hours < 24) return `${hours}h ago`;
                  if (days < 7) return `${days}d ago`;
                  return date.toLocaleDateString();
                };

                return (
                  <div key={room.id} className="room-item" onClick={() => handleJoinRoom(room.id)}>
                    <div className="room-header">
                      <div className="room-avatar">
                        {getRoomIcon(room.name)}
                      </div>
                      <div className="room-title-section">
                        <h3>{room.name}</h3>
                        <div className="room-meta">
                          <span className="room-creator">by {room.creatorUsername || `User #${room.createdBy}`}</span>
                          {room.lastMessageTime && (
                            <span className="room-time">{formatTime(room.lastMessageTime)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {room.lastMessage && (
                      <div className="room-preview">
                        <p>{formatLastMessage(room.lastMessage)}</p>
                      </div>
                    )}

                    <div className="room-stats">
                      <div className="stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>{room.messageCount || 0}</span>
                      </div>
                      <div className="stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{room.memberCount || 0}</span>
                      </div>
                    </div>

                    <div className="room-actions" onClick={(e) => e.stopPropagation()}>
                      {room.createdBy === user?.id && (
                        <button
                          onClick={(e) => handleDeleteRoom(room.id, e)}
                          className="btn-icon btn-danger-icon"
                          disabled={deletingRoom === room.id}
                          title="Delete room"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        className="btn-join"
                      >
                        <span>Join</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomList;

