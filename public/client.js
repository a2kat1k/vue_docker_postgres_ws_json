const WS_URI = `ws://${window.location.host}`;

const ws = new WebSocket(WS_URI);

const app = new Vue({
    el: '#app',
    data: {
        message: '',
        isReady: false,
        notes: [],
    },
    methods: {
        save(value) {
            console.log('[WebSocket]', 'send', this.message);
            ws.send(this.message);
            this.notes.push({'note':this.message,'commentdate': new Date()})
        },
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
    const message = event.data;
    app.$data.notes  =eval('(' + message + ')');
    console.log('[WebSocket]', 'received', JSON.stringify(app.$data.notes));
    //app.$data.message = message;
};
