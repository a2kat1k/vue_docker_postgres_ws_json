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

app.get('/vklogin', function(req, res) {
    
    console.log(req.code);

    res.send('This is not implemented now');
});

wss.on('connection', function connection(ws) {
    ws.on('message', (message) => {
        var mess = JSON.parse(message);
        if(mess.action == "save"){
            pool.query(
                {
                    text: 'insert into "Notes" (id, note, creation_date) values ($1, $2, current_timestamp)',
                    values: [mess.id,mess.message]
                },(err, res) => {
                    console.log(err);
            });
        }
        if(mess.action == "delete"){
            pool.query(
                {
                    text: 'delete from "Notes" where id = $1',
                    values: [mess.id]
                }, (err, res) => {

            });
        }
        console.log('[WebSocket]', 'received', mess);				
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
server.listen(8081, function listening() {
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
