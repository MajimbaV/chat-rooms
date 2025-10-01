


const searchParams = new URLSearchParams(window.location.search);
const username = searchParams.get("username") || "Anonymous";
const room = searchParams.get("room");
const wsURI = `ws://${window.location.host}/chat/?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`;
const websocket = new WebSocket(wsURI);


const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messagesList = document.getElementById("messagesList");


window.onload = () => {
    document.getElementById("roomName").textContent = room;
};

function addMessage(message) {
    const messageItem = document.createElement("li");
    messageItem.textContent = `[${message.timestamp}] ${message.username} : ${message.text}`;
    messagesList.appendChild(messageItem);
    messagesList.scrollTop = messagesList.scrollHeight; // Auto-scroll to the latest message
}

function renderMessages(messages) {
    messagesList.innerHTML = "";
    messages.forEach((message) => {
      addMessage(message);
    });
}

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = {type: 'chat', timestamp: `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, text: messageInput.value };
  websocket.send(JSON.stringify(message));
  messageInput.value = "";
});


websocket.addEventListener("open", (event) => {
  console.log("Connected to WebSocket server");
});

websocket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  switch(message.type) {
    case 'chat':
      addMessage(message);
      break;
    default:
      console.error(`Unknown message type: ${message.type}, content: ${message.message}`);
      return;
  }
});

websocket.addEventListener("close", (event) => {
  console.log("Disconnected from WebSocket server");
});

websocket.addEventListener("error", (event) => {
  console.error("WebSocket error: ", event);
}); 