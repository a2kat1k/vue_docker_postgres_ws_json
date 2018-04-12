require('dotenv').config()


const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const { Pool } = require('pg')
const pool = new Pool()

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));


wss.on('connection', function connection(ws) {
    ws.on('message', (message) => {
        console.log('[WebSocket]', 'received', message);
        pool.query(`UPDATE student SET student=jsonb_set(student,'{name,first_name}','"${message}"',true)`);
		
				
    });

	pool.query("select student -> 'name' ->> 'first_name' as name from student", (err, res) => {
		if (res.rows.length) {
				const message = res.rows[0].name;
				console.log('[WebSocket]', 'send', message);
				ws.send(message);
		}
	});
});
server.listen(8080, function listening() {
    console.log('Listening on %d', server.address().port);
});
