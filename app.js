const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`💭 server on port ${PORT}`));
const io = require('socket.io')(server);

// MongoDB connection
mongoose.connect('your_connection_string')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Schema and Model
const messageSchema = new mongoose.Schema({
    name: String,
    message: String,
    dateTime: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

let socketsConnected = new Set();

io.on('connection', onConnected);

function onConnected(socket) {
    console.log(socket.id);
    socketsConnected.add(socket.id);

    io.emit('clients-total', socketsConnected.size);

    // Fetch and emit previous messages
    Message.find().sort({ dateTime: 1 }).limit(10).exec((err, messages) => {
        if (!err) {
            socket.emit('load-messages', messages);
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected', socket.id);
        socketsConnected.delete(socket.id);
        io.emit('clients-total', socketsConnected.size);
    });

    socket.on('message', (data) => {
        console.log(data);
        const message = new Message(data);
        message.save();  // Save the message to the database
        socket.broadcast.emit('chat-message', data);
    });

    socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data);
    });
    
}
