const util = require('util');
const express = require('express')
const app = express()
//const port = 433433
const bodyParser = require('body-parser')
var cors = require('cors')
const fs = require('fs');
const sys = require('util');
var mqtt = require('mqtt');
const mcpadc = require('mcp-spi-adc');
var Jimp = require('jimp');

app.use(cors())
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({limit: '50mb',extended: true }))
const exec = util.promisify(require('child_process').exec);

//*********************** MQTT Config ****************************//
const MQTT_SERVER = "34";
const MQTT_PORT = "";
//if your server don't have username and password let blank.
const MQTT_USER = ""; 
const MQTT_PASSWORD = "";
var node = 1
var countertime = 0;

var time_1week = 604800
var time_1week_status = false;

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
       client.subscribe(`resetnode${node}`, function (err) {
        if (err) {
            console.log(err);
        }
    });
	client.subscribe(`enable1week`, function (err) {
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
const port_ = 60146
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
	if(set_lat && set_lon){
		client.publish(`node${node}`, JSON.stringify({"node":node ,"lat":set_lat ,"lng":set_lon,"status":true}));

	}else{
		//client.publish(`node${node}`, JSON.stringify({"node":node ,"lat":0 ,"lng":0,"status":true}));

	}
        //client.publish(`node${node}`, JSON.stringify({"node":node ,"lat":set_lat ,"lng":set_lon,"status":true}));
    }

   if( topic == `resetnode${node}` ) {
	console.log("Reset!!");
        RestartFuc() ;
   }

   if( topic == `enable1week` ) {
	time_1week_status = !time_1week_status ;
	if( time_1week_status ){
		time_1week = 60;
	}else{
		time_1week = 604800;
	}
	console.log("Status 1 week : " + time_1week_status)
   }

});
// Lat Lng Steam

 

// Printer Function
async function lsWithGrep() {
  try {
      //await exec('sudo qrcode -o out.png ${msg}');
	//await QR.toFile("out.png",msg);
      const { stdout, stderr } = await exec('sudo lp -o fit-to-page image.png');
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
  }catch {
     return ;
  };
};

app.post('/print',(req,res) => {
	// Remove header
	//console.log(req.body.data)
	let base64Image = req.body.data.toString().split(';base64,').pop();
	fs.writeFile('image.png', base64Image, {encoding: 'base64'}, function(err) {
	  console.log('File created');
	});
	//**

	//**
	//lsWithGrep();  //<-- Enable Printer
	res.json({"msg":"1"})

	res.status(200)
})
// Printer Function

function count1week() {
    app.get('/reset',(req , res) => {
        countertime = 0;
        res.json({"Succ":"1" , "count":countertime}).status(200)
    })
    app.get('/count', (req , res) => {
	res.json({"count":countertime , "time1week":time_1week}).status(200)
    })
    if(countertime > time_1week){
        countertime = 0;
	client.publish(`1weeknode${node}` , JSON.stringify({}))    
    }
    countertime++;
    console.log(countertime)
}

setInterval(count1week , 1000);


//** Check Voltage Function ***

const tempSensor = mcpadc.openMcp3208(0,{}, err => {
  if (err) throw err;
 
setInterval(_ => {
    tempSensor.read((err, reading) => {
      if (err) throw err;
 
      //console.log((reading.value * 3.3 - 0.5) * 100);
        console.log(reading.value)
        if(reading.value < 0.3 && reading.value > 0.2){
                console.log("Warnnig Low Voltage!!")
		client.publish(`voltagenode${node}` , JSON.stringify({}))
        }
    });
  }, 1000);
});

//-----------Button Restart Funtion----------
var countRes = 0;
const BtnRestart = mcpadc.openMcp3208( 6 ,{}, err => { // 6 is channal 6 in MCP3208
  if (err) throw err;


setInterval(_ => {
    BtnRestart.read((err, reading) => 
	{
      if (err) throw err;
        	if (reading.value > 0.8 )
		{
                	console.log("Reseting : " , countRes);
			if( countRes >= 10)
			{
				RestartFuc() ;
			}
          		countRes = countRes + 1;  

           	}
		else 
		{
			countRes = 0;
		}
         }
     );
  }, 250);
});

async function RestartFuc() {
  try 
  {
      const { stdout, stderr } = await exec('sudo reboot');
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
      console.log("Task Test!");
  }
  catch 
  {
     return ;
  };
};

//-----------Button Restart Funtion----------

//Test Udate 5678 12120
