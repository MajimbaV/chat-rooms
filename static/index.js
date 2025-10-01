const roomInput = document.getElementById("roomInput");
const usernameInput = document.getElementById("usernameInput");
const joinRoomButton = document.getElementById("joinRoomButton");


function expandContainer() {
    roomInput.classList.remove("inactive");
    joinRoomButton.textContent = "Entrar na Sala";
    document.querySelector('.joinContainer').classList.add('expanded');
}

joinRoomButton.addEventListener("click", (event) => {
    event.preventDefault();
    const room = roomInput.value.trim().toUpperCase();
    const username = usernameInput.value.trim() || "Anonymous";

    if (roomInput.classList.contains("inactive")) {
        expandContainer();
        return;
    }
    if (!room) return alert("Por favor insira o código da sala.");
    window.location.href = `/chat?username=${username}&room=${room}`;
});
