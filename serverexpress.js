import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import url from 'url';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;
const rooms = new Map(); // roomCode -> { clients: Set, messageLog: [] }

// Servir arquivos estáticos da pasta 'static'
app.use(express.static(path.join(process.cwd(), 'static')));
app.use(express.urlencoded({ extended: true }));

// Cria a sala com o POST da página inicial
app.post('/', express.json(), (req, res) => {
	let roomCode;
	do {
		roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
	} while (rooms.has(roomCode));
	rooms.set(roomCode, { clients: new Set(), messageLog: [] });

	const formData = req.body;
	const username = formData.username || 'Anonymous';
	res.redirect(`/chat?username=${encodeURIComponent(username)}&room=${roomCode}`);
});

app.get('/chat', (req, res) => {
	req.query.room = req.query.room?.toString().toUpperCase();
	if (!req.query.room || !rooms.has(req.query.room)) {
		return res.status(404).send('Sala não encontrada');
	}
	res.sendFile(path.join(process.cwd(), 'static', 'chat.html'));
});


// Websocket Connection

wss.on('connection', (ws, req) => {
	const params = url.parse(req.url, true).query;
	if (!params.room || !rooms.has(params.room)) {
		ws.send(JSON.stringify({ type: 'error', message: 'Sala não encontrada' }));
		return ws.close();
	}
	ws.username = params.username;
	ws.room = params.room;
	rooms.get(ws.room).clients.add(ws);
	rooms.get(ws.room).messageLog.forEach(msg => {
		if (ws.readyState === ws.OPEN) {
			ws.send(JSON.stringify(msg));
		}
	});
	ws.on('message', (message) => {
		let data;
		try {
			data = JSON.parse(message);
		} catch (err) {
			ws.send(JSON.stringify({ type: 'error', message: 'Mensagem inválida' }));
			return;
		}
		switch (data.type) {
			case 'chat': {
				const msg = {
					type: data.type,
					username: ws.username || 'Anonymous',
					timestamp: data.timestamp,
					text: data.text
				};
				rooms.get(ws.room).messageLog.push(msg);
				if (rooms.get(ws.room).messageLog.length > 100) {
					rooms.get(ws.room).messageLog.shift(); // Keeps the log at 100 messages maximum
				}
				// Send only to the clients in the same room
				rooms.get(ws.room).clients.forEach(client => {
					if (client.readyState === ws.OPEN) {
						client.send(JSON.stringify(msg));
					}
				});
				break;
			}
		}
	});
	ws.on('close', () => {
		if (ws.room && rooms.has(ws.room)) {
			rooms.get(ws.room).clients.delete(ws);
			if (rooms.get(ws.room).clients.size === 0) rooms.delete(ws.room);
		}
	});
});

server.listen(PORT, () => {
	console.log(`Servidor Express rodando em http://localhost:${PORT}`);
});
