const socket = io();

const clientsTotal = document.getElementById('clients-total');
const messageContainer = document.getElementById('message-Container');
const nameInput = document.getElementById('name-Input');
const messageForm = document.getElementById('message-Form');
const messageInput = document.getElementById('message-Input');

const messageTone = new Audio('/Case-closed.mp3');

// Set initial name value
let userName = nameInput.value || 'anonymous';

// Update userName on input change
nameInput.addEventListener('input', () => {
    userName = nameInput.value || 'anonymous';
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

function sendMessage(){
    if (messageInput.value === '') return;
    const data = {
        name: userName,
        message: messageInput.value,
        dateTime: new Date()
    };
    socket.emit('message', data);
    addMessageToUI(true, data);
    messageInput.value = '';
}

socket.on('clients-total', (data) => {
    clientsTotal.innerText = `Total Clients: ${data}`;
});

socket.on('chat-message', (data) => {
    messageTone.play();
    addMessageToUI(false, data);
});

function addMessageToUI(isOwnMessage, data) {
    clearFeedback();

    const element = `
        <li class="${isOwnMessage ? "message-right" : "message-left"}">
            <p class="message">
                ${data.message}
                <span><h5>${data.name} ● ${moment(data.dateTime).fromNow()}</h5></span>
            </p>
        </li>`;

    messageContainer.innerHTML += element;
    scrollToBottom();
}

function scrollToBottom() {
    messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

messageInput.addEventListener('focus', () => {
    socket.emit('feedback', {
        feedback: `✍ ${userName} is typing a message`,
    });
});

messageInput.addEventListener('keypress', () => {
    socket.emit('feedback', {
        feedback: `✍ ${userName} is typing a message`,
    });
});

messageInput.addEventListener('blur', () => {
    socket.emit('feedback', {
        feedback: '',
    });
});

socket.on('feedback', (data) => {
    clearFeedback();

    const element = `
        <li class="message-feedback">
            <p class="feedback" id="feedback"> ${data.feedback} </p>
        </li>`;

    messageContainer.innerHTML += element;
});

function clearFeedback() {
    document.querySelectorAll('li.message-feedback').forEach(element => {
        element.parentNode.removeChild(element);
    });
}

socket.on('load-messages', (messages) => {
    messages.forEach((message) => {
        addMessageToUI(false, message);
    });
});
