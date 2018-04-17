require('dotenv').config()


const express = require('express')
const http = require('http')
const https = require('https')
const WebSocket = require('ws')
const { Pool } = require('pg')
const pool = new Pool()
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const client_id = 4571390;
const client_seecret = 'rwUBryJiHxxqoNARgRNj';
const redirect_uri = 'http://a2kat.crabdance.com:8081/vklogin';
var access_token;
var email;
var user_id;

app.use(express.static('public'));

//app.use(express.cookieDecoder());
//app.use(express.session());

function loadUser(req, res, next) {
    console.log("here we are");
    if (user_id != '') {
        res.redirect('/index.html');
    } else {
      res.redirect('/welcome.html');
    }
  }
  
  app.get('/', loadUser, function(req, res) {
    
  });

app.get('/vklogin', function (req, res) {
    console.log(req.query.code);
    var query = `https://oauth.vk.com/access_token?client_id=${client_id}&client_secret=${client_seecret}&redirect_uri=${redirect_uri}&code=${req.query.code}`;
    console.log(query);
    https.get(query,
        (responce) => {
            responce.setEncoding('utf8');

            // incrementally capture the incoming response body
            var body = '';
            responce.on('data', function (d) {
                body += d;
            });

            // do whatever we want with the response once it's done
            responce.on('end', function () {
                try {
                    var parsed = JSON.parse(body);
                    console.log("parse access %o", parsed);
                } catch (err) {
                    console.error('Unable to parse response as JSON', err);
                    res.send(err);
                }
                access_token =  parsed.access_token;
                email = parsed.email;
                user_id = parsed.user_id;
                console.log(`${access_token} ${email} ${user_id}`);
                res.send(`Привет ${email}`);
            });
        }).on('error', function(err) {
            // handle errors with the request itself
            console.error('Error with the request:', err.message);
            cb(err);
        });
    //res.send('This is not implemented now');
});

wss.on('connection', function connection(ws) {
    ws.on('message', (message) => {
        var mess = JSON.parse(message);
        if (mess.action == "save") {
            pool.query(
                {
                    text: 'insert into "Notes" (id, note, creation_date) values ($1, $2, current_timestamp)',
                    values: [mess.id, mess.message]
                }, (err, res) => {
                    console.log(err);
                });
        }
        if (mess.action == "delete") {
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
