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
        pool.query(`insert into "Notes" (id, note, creation_date) values (default,'${message}', current_timestamp)`,(err, res) => {
		});
		
				
    });

	pool.query(`select array_to_json(array_agg(row_to_json(t))) as json from (
		select id, note, to_char(creation_date,'FMDay, FMDD Mon HH12:MI:SS') as commentDate from "Notes") t`, (err, res) => {
		var arr = res.rows[0].json;
		if (IsJsonArray(arr)) {
				console.log('[WebSocket]', 'send', JSON.stringify(arr));
				ws.send(JSON.stringify(arr));
		}
	});
});
server.listen(8080, function listening() {
    console.log('Listening on %d', server.address().port);
});

function IsJsonArray(arr) {
    try {
        JSON.parse(arr[0].id);
    } catch (e) {
        return false;
    }
    return true;
}
