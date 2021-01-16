const util = require('util');
const express = require('express')
const app = express()
//const port = 433433
const bodyParser = require('body-parser')
var cors = require('cors')
const fs = require('fs');
const sys = require('util');
var mqtt = require('mqtt');

app.use(cors())
app.use(bodyParser.urlencoded({extended: true }))
const exec = util.promisify(require('child_process').exec);

//*********************** MQTT Config ****************************//
const MQTT_SERVER = "34.64.169.182";
const MQTT_PORT = "1883";
//if your server don't have username and password let blank.
const MQTT_USER = ""; 
const MQTT_PASSWORD = "";
var node = 1

var client = mqtt.connect({
    host: MQTT_SERVER,
    port: MQTT_PORT,
    username: MQTT_USER,
    password: MQTT_PASSWORD
});

client.on('connect', function () {
    // Subscribe any topic
    console.log("MQTT Connect");
    client.subscribe('test', function (err) {
        if (err) {
            console.log(err);
        }
    });
});



//********************************//

const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

SerialPort.list(function (err, ports) {
  console.log(ports);
});

const parser = new parsers.Readline({
  delimiter: '\r\n'
});

const port = new SerialPort('/dev/ttyAMA0', {
  baudRate: 9600
});

port.pipe(parser);

var GPS = require('gps');
var gps = new GPS;
var set_lat
var set_lon
var mytime

/*
gps.on('data', function(data) {

  console.log(data);

});

*/
/*
if(set_lat && set_lon){

}else{
	  gps.on('GLL',({lat,lon}) => {
             // console.log({lat,lon})
              set_lat = lat 
              set_lon = lon
              var array = [];
              array.push({lat,lon})
              console.log(array)      
         })

        parser.on('data', function(data) {
          gps.update(data);
        });

} */

try {
        gps.on('GLL',async function({lat,lon}) {
             // console.log({lat,lon})
              set_lat = lat 
              set_lon =  lon
                var array = [];
                array.push({lat,lon})
                console.log(array) 
     
         })

        parser.on('data',async function(data) {
        	 gps.update(data);
        });
}catch (err) {

}

const port_ = 8888
app.get('/gps',(req,res) => {
	var arr=[];
	//************************
/*  
     gps.on('GLL',({lat,lon}) => {
             // console.log({lat,lon})
              set_lat = lat 
              set_lon =  lon
                var array = [];
                array.push({lat,lon})
                console.log(array)
		gps.off('GLL')
         })
	
        parser.on('data', function(data) {
	        gps.update(data);

        });
*/
	//************************
	arr.push({"lat":set_lat,"lng":set_lon})
        res.json(arr)
    //gps.on('data',({lat,lon}) => {res.json({lat,lon})});
})

app.listen(port_, () => {
        console.log(`Get Lat Long From!! http://localhost:${port_}`)
})


// Lat Lng Steam 
client.on('message', (topic, message) => {
    // message is Buffer
    message = JSON.parse(message)
    //console.log(JSON.parse(message));
    if(message.msg === node){
        console.log(`NODE ${node}`)
        client.publish(`node${node}`, JSON.stringify({"node":node ,"lat":set_lat ,"lng":set_lon,"status":true}));
    }

});
// Lat Lng Steam 

