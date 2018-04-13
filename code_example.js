pool.query(`UPDATE student SET student=jsonb_set(student,'{name,first_name}','"${message}"',true)`,(err, res) => {
    console.log(err + " " + res);
    ws.send(res);
});

pool.query("select student -> 'name' ->> 'first_name' as name from student", (err, res) => {
    if (res.rows.length) {
            const message = res.rows[0].name;
            console.log('[WebSocket]', 'send', message);
            ws.send(message);
    }
});

//insert into "Note" (id,note,creation_date) values (default,'третяя',current_timestamp);
select array_to_json(array_agg("Note"))  from "Note"