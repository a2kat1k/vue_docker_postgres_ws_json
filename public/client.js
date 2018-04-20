const WS_URI = `ws://${window.location.host}`;
const ws = new WebSocket(WS_URI);



const app = new Vue({
    el: '#app',
    components: {
        'tiny-slider': VueTinySlider
    }
    data: {
        message: '',
        isReady: false,
        notes: [],
        avatar: './kirill.jpg',
        first_name: '',
        images: [],
        cur_photo: 0
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
            this.notes.push({ 'note': this.message, 'commentdate': new Date().toLocaleString('ru-RU', options).capitalize(), 'id': id });
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
        },
        move: function (dir) {
            this.$refs[`image-${this.cur_photo}`][0].style.display = "none";
            this.cur_photo += dir;
            this.$refs[`image-${this.cur_photo}`][0].style.display = "inline";

        }
    },
});
//app.use(VueTinySlider);
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
    console.log("WS reseived" + message);
    var mess = JSON.parse(message);

    switch (mess.action) {
        case "notes":
            mess.notes.forEach(element => {
                element.commentdate = new Date(element.commentdate.replace(' ', 'T')).toLocaleString('ru-RU', options).capitalize();
            });
            app.$data.notes = eval('(' + JSON.stringify(mess.notes) + ')');
            var mess_back = {
                action: "ava"
            }
            ws.send(JSON.stringify(mess_back));
        case "ava":
            app.$data.avatar = mess.ava["response"][0].photo_200;
            app.$data.first_name = mess.ava["response"][0].first_name;
            var mess_back = {
                action: "photos"
            }
            ws.send(JSON.stringify(mess_back));
        case "photos":
            var items = mess.photos["response"]["items"];
            var photoArray = [];

            items.forEach(item => {
                if (typeof item.photo_2560 !== 'undefined') { photoArray.push(item.photo_2560); } else
                    if (typeof item.photo_1280 !== 'undefined') { photoArray.push(item.photo_1280); } else
                        if (typeof item.photo_807 !== 'undefined') { photoArray.push(item.photo_807); } else
                            if (typeof item.photo_604 !== 'undefined') { photoArray.push(item.photo_604); }
            });

            app.$data.images = shuffle(photoArray);
            app.$nextTick(function () {
                this.$refs[`image-${this.cur_photo}`][0].style.display = "inline";
            })

        /*
        photoArray.forEach(item => {
            console.log(item);
        });*/
    }


    //console.log('[WebSocket]', 'received', JSON.stringify(app.$data.notes));
    //app.$data.message = message;
};
