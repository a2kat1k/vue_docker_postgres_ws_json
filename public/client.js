const WS_URI = `ws://${window.location.host}`;

const ws = new WebSocket(WS_URI);

const app = new Vue({
    el: '#app',
    data: {
        message: '',
        isReady: false,
        notes: [],
        avatar: './kirill.jpg'
    },
    methods: {
        save(value) {
            var id = Math.floor(Math.random() * (10000000 - 5000000)) + 5000000;
            console.log('[WebSocket]', 'send', this.message);
            var mess = {
                action: "save",
                message: this.message,
                id: id
            }
            ws.send(JSON.stringify(mess));
            this.notes.push({ 'note': this.message, 'commentdate': new Date(), 'id': id });
            this.message = '';
        },
        delete_note: function (index) {
            const itemId = this.notes[index].id;
            this.notes.splice(index, 1);
            var mess = {
                action: "delete",
                id: itemId
            }
            ws.send(JSON.stringify(mess));
        }
    },
});

ws.onopen = () => {
    console.log('[WebSocket]', 'connected to', WS_URI);
    app.$data.isReady = true;
};
ws.onclose = () => {
    console.log('[WebSocket]', 'disconnected', event.code);
    app.$data.isReady = false;
};
ws.onerror = () => {
    console.error('[WebSocket]', 'error');
    app.$data.isReady = false;
};
ws.onmessage = (event) => {
    console.log("we reseiced from ws " + event.data);
    const message = event.data;
    var mess = JSON.parse(message);

    switch (mess.action) {
        case "notes":
            console.log("received notes:" + JSON.stringify(mess.notes));
            app.$data.notes = eval('(' + JSON.stringify(mess.notes) + ')');
            var mess_back = {
                action: "ava"
            } 
            ws.send(JSON.stringify(mess_back));
        case "ava":
        console.log("received avatar:" +  mess.ava["response"][0].photo_200);
        app.$data.avatar = JSON.stringify(mess.ava["response"][0].photo_200);
    }


    //console.log('[WebSocket]', 'received', JSON.stringify(app.$data.notes));
    //app.$data.message = message;
};
