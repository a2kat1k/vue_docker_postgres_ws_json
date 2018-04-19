require('dotenv').config()


const express = require('express')
const http = require('http')
const https = require('https')
const WebSocket = require('ws')
const { Pool } = require('pg')
var session = require('express-session')

const pool = new Pool()
const app = express();

app.use(session({ secret: 'tokennn', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true}));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const client_id = 4571390;
const client_seecret = 'rwUBryJiHxxqoNARgRNj';
const redirect_uri = 'http://a2kat.crabdance.com:8081/vklogin';
var user_id = '';
var photos;
var ava;

// Access the session as req.session
app.get('/', function (req, res, next) {
    app.use(express.static('public'));
    var sessData = req.session;
    if (typeof sessData.user_id !== 'undefined') {
        res.redirect('/index.html');
    } else {
        res.redirect('/welcome.html');
    }
});
/*
function loadUser(req, res, next) {
    // console.log("here we are");
    if (user_id.length > 0) {
        app.use(express.static('public'));
        res.redirect('/index.html');
    } else {
        app.use(express.static('public'));
        res.redirect('/welcome.html');
    }
}

app.get('/', loadUser, function (req, res) {
    console.log("fuck it!");
});
*/
app.get('/ava', function (req, res, next) {
    if (typeof req.session.user_id !== 'undefined') {
        res.json(req.session.ava);
    }
});
app.get('/photos', function (req, res, next) {
    if (typeof req.session.user_id !== 'undefined') {
        res.json(req.session.photos);
    }
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
                } catch (err) {
                    console.error('Unable to parse response as JSON', err);
                    res.send(err);
                }
                var sessData = req.session;

                sessData.access_token = parsed.access_token;
                sessData.email = parsed.email;
                sessData.user_id = parsed.user_id;
                user_id = parsed.user_id;

                var query_photos = `https://api.vk.com/method/photos.getUserPhotos?v=${5.74}&access_token=${sessData.access_token}&user_id=${user_id}&offset=${0}&count=${1000}&extended=${1}`;
                var body_resp;
                https.get(query_photos,
                    (resp_vk) => {
                        resp_vk.setEncoding('utf8');
                        var photos = '';
                        resp_vk.on('data', (dd) => {
                            photos += dd;
                        });
                        resp_vk.on("end", () => {
                            body_resp = JSON.parse(photos);
                            //console.log("photos "+ JSON.stringify(body_resp));
                        });
                    }).on('error', (e) => {
                        console.error(e);
                    });
                var bdy;
                https.get(`https://api.vk.com/method/users.get?v=${5.74}&access_token=${sessData.access_token}&user_ids=${user_id}&name_case=nom&fields=photo_200`,
                    (resp_vk2) => {
                        resp_vk2.setEncoding('utf8');
                        var photo = '';
                        resp_vk2.on('data', (d) => {
                            photo += d;
                        });
                        resp_vk2.on("end", () => {
                            bdy = JSON.parse(photo);
                            //console.log("ava "+ JSON.stringify(bdy));
                        });
                    }).on('error', (e) => {
                        console.error(e);
                    });
                sessData.photos = body_resp;
                sessData.ava = bdy;
                photos = body_resp;
                ava = bdy;
                // console.log(`${access_token} ${email} ${user_id}`);
                res.redirect('/index.html');
            });
        }).on('error', function (err) {
            // handle errors with the request itself
            console.error('Error with the request:', err.message);
            cb(err);
        });
    //res.send('This is not implemented now');
});

wss.on('connection', function connection(ws) {
    ws.on('message', (message) => {
        var mess = JSON.parse(message);
        switch (mess.action) {
            case "save":
                pool.query(
                    {
                        text: 'insert into "Notes" (id, note, creation_date, user_id) values ($1, $2, current_timestamp,$3)',
                        values: [mess.id, mess.message, user_id]
                    }, (err, res) => {
                        console.log(err);
                    });
            case "delete":
                pool.query(
                    {
                        text: 'delete from "Notes" where id = $1',
                        values: [mess.id]
                    }, (err, res) => {

                    });
            case "ava":
                var mess = {
                    action: "ava",
                    ava: ava
                }
                ws.send(JSON.stringify(mess));
        }


        console.log('[WebSocket]', 'received', mess);
    });

    pool.query(`select array_to_json(array_agg(row_to_json(t))) as json from (
		select id, note, to_char(creation_date,'FMDay, FMDD Mon HH12:MI:SS') as commentDate from "Notes" where user_id = '${user_id}') t`, (err, res) => {
            var arr = res.rows[0].json;
            if (IsJsonArray(arr)) {
                console.log('[WebSocket]', 'send', JSON.stringify(arr));
                var mess = {
                    action: "notes",
                    notes: arr
                }
                ws.send(JSON.stringify(mess));
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
