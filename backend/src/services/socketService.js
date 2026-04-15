const { protect } = require('../middleware/auth');

const setupSocketHandlers = (io) => {
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);

      if (!connectedUsers.has(roomId)) {
        connectedUsers.set(roomId, new Map());
      }
      connectedUsers.get(roomId).set(userId, socket.id);

      socket.to(roomId).emit('user-joined', userId);

      const usersInRoom = Array.from(connectedUsers.get(roomId).keys());
      socket.emit('room-users', usersInRoom.filter(u => u !== userId));
    });

    socket.on('leave-room', (roomId, userId) => {
      socket.leave(roomId);

      if (connectedUsers.has(roomId)) {
        connectedUsers.get(roomId).delete(userId);
      }

      socket.to(roomId).emit('user-left', userId);
    });

    socket.on('call-user', ({ userToCall, signalData, from }) => {
      io.to(userToCall).emit('call-user', {
        signal: signalData,
        from,
        callerId: socket.id
      });
    });

    socket.on('answer-call', (signal, to) => {
      io.to(to).emit('call-accepted', signal);
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      io.to(to).emit('ice-candidate', {
        candidate,
        from: socket.id
      });
    });

    socket.on('transcript-update', ({ roomId, transcriptEntry }) => {
      socket.to(roomId).emit('transcript-update', transcriptEntry);
    });

    socket.on('meeting-start', ({ roomId }) => {
      socket.to(roomId).emit('meeting-started');
    });

    socket.on('meeting-end', ({ roomId }) => {
      socket.to(roomId).emit('meeting-ended');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      connectedUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
        }
      });
    });
  });
};

module.exports = { setupSocketHandlers };