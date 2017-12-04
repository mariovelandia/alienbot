'use strict';

const five = require('johnny-five');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

var board = new five.Board();

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/index.html')
});

board.on('ready', function() {
    
  console.log('Arduino is ready.');
  // Variables de progreso y limites. Valores por defecto: brazo abajo
  var pendienteDeMovimiento = true; // Reading PIR
  var pendienteAEscuchar = false; // Can open microphone in webserver
  var pendienteDeEleccion = false; // Reading front photoresistors
  var intencionDeHablar = 400; // Photoresistor Hand
  var intencionDeEleccion = 300; // Photoresistors Yes and No
  // Crear Objetos - Asignación de pines
  var motorArm; motorArm = new five.Motor({ pins: { pwm: 11, dir: 9, cdir: 8 } });
  var motorHand; motorHand = new five.Motor({ pins: { pwm: 5, dir: 4, cdir: 3 } });
  var prHiFive = new five.Sensor({ pin: "A11", freq: 250 });  
  var prSi = new five.Sensor({ pin: "A3", freq: 250 });  
  var prNo = new five.Sensor({ pin: "A5", freq: 250 });  
  var motion = new five.Motion(53);
  var ledVerde = new five.Led(45);
  var ledRojo = new five.Led(47);
  var leds = new five.Leds([20,16,39,24,50,28]);

  // Permitir los objetos ser usados en la consola
  board.repl.inject({ 
    motorArm: motorArm, 
    motorHand: motorHand,
    motion: motion,
    leds: leds,
    ledRojo: ledRojo,
    ledVerde: ledVerde
  });
  
  // Motores: moveHand('up') - moveHand('down')
  function moveHand( dir ){
    if( dir == 'down' ){       
      motorHand.forward(50);
    } else if( dir == 'up' ){      
      motorHand.reverse(50);  
    }
    setTimeout(function() { motorHand.stop() }, 700);
  }
  function moveArm( dir ){
    if( dir == 'down' ){       
      motorArm.forward(250);
    } else if( dir == 'up' ){      
      motorArm.reverse(250);  
    }
    setTimeout(function() { motorArm.stop() }, 2000);
  }

  // Leds Platillo
  function onLed(indexEspected) {
    leds.off();
    leds.each(function(led, index) {
      if (index == indexEspected) { led.on(); }
    });
  }
  var indexEspected = 0;
  setInterval(function(){ 
    onLed(indexEspected); 
    if( indexEspected < 7 ){ indexEspected++; }
    else { indexEspected = 0 } 
  }, 200);   

  function wantDecision() {
    ledVerde.blink();
    ledRojo.blink();
    pendienteDeEleccion = true;
  }

  // Listen to the web socket connection
  io.on('connection', function(client) {    
    // Registrar conexión exitosa con el servidor
    client.on('join',function(data){ console.log(data); });
    // Imprimir en consola
    client.on('log', function(txt) { console.log(txt); });
    // Solicitud para escuchar
    client.on('listen', function(txt) { pendienteAEscuchar = true; });
    // Solicitud para desicion
    client.on('decision', function(txt) { wantDecision(); });
    // Apertura del microfono en webserver
    prHiFive.on('data', function() {
      if( this.value < intencionDeHablar && pendienteAEscuchar === true ){          
         client.emit('escuchar'); 
         pendienteAEscuchar = false;
      }
      // console.log(this.value);
    });
    prSi.on('data', function(){
      // if( this.value < intencionDeEleccion && pendienteDeEleccion === true ){          
      //    client.emit('respuesta','si'); 
      //    pendienteDeEleccion = false;
      // }
      if( this.value < intencionDeEleccion ){          
         client.emit('escuchar');     
      }
    });
    prNo.on('data', function(){
      if( this.value < intencionDeEleccion && pendienteDeEleccion === true ){          
         client.emit('respuesta','no'); 
         pendienteDeEleccion = false;
      }
    });
    motion.on('motionstart',function() {
      console.log('se movio');
      if( pendienteDeMovimiento === true ){
        moveArm('down');
        client.emit('respuesta','Hola Alien');
        pendienteDeMovimiento = false;
      }      
    });
  });

});

const port = process.env.PORT || 3000;
server.listen(port);

// wantDecision();
// leds.on();

// prHiFive.on("data", function() { 
//   console.log('prHiFive');
//   console.log( this.value );
// });

// prNo.on("data", function() { 
//   console.log('prNo');
//   console.log( this.value );
// });
// prSi.on("data", function() { 
//   console.log('prSi');
//   console.log( this.value );
// });