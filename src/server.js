var express = require('express');
var path = require('path')
var bodyParser = require('body-parser');

var pg = require("pg");
var pool = new pg.Pool({
    user: 'daftardaran',
    host: '127.0.0.1',
    database: 'daftardarandb',
    password: 'secs3p#1994',
    port: '5432'
})

var app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res){
    res.sendFile(path.join(__dirname + 'public/index.html'));
});

app.post('/ucserialnumber', function (req, res){
    let serialNum = req.body.serialNum;
    serialNum.trim();
    let hdSerialNum = req.body.HDSerial;

    if (serialNum == '' || serialNum == undefined){
        res.send("False");
        res.end();
    } else {
        try {
            pool.connect(function(err, client, done){
                if (err) {
                    console.log("Could not connect to database: " + err);
                    res.status(400).send("Server Error");
                    return;
                } 
    
                try {
                    client.query('SELECT serialnumber, hdserialnumber, lock, install_times from um_serialnumbers where serialnumber like $1', [serialNum],function(err,result){
                        done(); // closing the connection;
                        if (err){
                            console.log("Could not query to databaase: " + err);
                            res.status(400).send("Server Error");
                            return;
                        }
                            
                        if (result.rowCount == 0) {
                            res.send("False");
                            res.end();
                        } else {
                            if (result.rows[0].serialnumber == serialNum)
                                installTimes = result.rows[0].install_times;

                                if (result.rows[0].lock != true) {
                                    installTimes++;
                                    client.query("UPDATE um_serialnumbers SET hdserialnumber = $1, activation_time = now(), lock = true, install_times = $2 where serialnumber like $3"
                                    ,[hdSerialNum.toString(), installTimes, serialNum.toString()]);
                                    done();
                                    res.send("True");
                                    res.end();
                                } else {
                                    if (result.rows[0].hdserialnumber == hdSerialNum) {
                                        res.send("True");
                                        res.end();
                                    } else {
                                        res.send("Locked");
                                        res.end();
                                    }
                                }
                        }});
                } catch (error) {
                    console.log("CATCHED: Could not query to databaase: " + err);
                    res.status(400).send("Server Error");
                }
            });
        } catch (error) {
            console.log("CATCHED: Could not connect to database: " + err);
            res.status(400).send("Server Error");
        }
    }
});


var server = app.listen(80, function () {
    var host = "206.222.8.244";
    var port = server.address().port;
    
    console.log("Listening at http://%s:%s", host, port); 
});
