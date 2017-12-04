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
    
  console.log('Hello World!');
  // Crear Objetos - Asignación de pines
  var motor1; motor1 = new five.Motor({ pins: { pwm: 7, dir: 6, cdir: 5 } });
  var button = new five.Button("A15");
  var leds1 = new five.Led.RGB({ pins: { red: 10, green: 9, blue: 8 } });
  var leds2 = new five.Led.RGB({ pins: { red: 13, green: 12, blue: 11 } });
  // Permitir los objetos ser usados en la consola
  board.repl.inject({ 
    motor1: motor1,
    button: button,
    leds1: leds1,
    leds2: leds2,
  });

  // Gestos
  function gesto( tipo ) {    
    if( tipo == 'normal' ){ 
      var colorLeds1 = '#0000FF'; var colorLeds2 = '#FFFFFF';
      leds1.color( colorLeds1 ); leds2.color( colorLeds2 );  
      setTimeout(function() { leds2.blink(700) }, 700);
      leds1.blink(700);
    }
    if( tipo == 'feliz' ){ 
      colorLeds1 = '#0000FF'; colorLeds2 = '#00FF00'; leds1.blink(); 
      leds1.color( colorLeds1 ); leds2.color( colorLeds2 );     
    }
    if( tipo == 'enojado' ){ 
      colorLeds1 = '#FF0000'; colorLeds2 = '#FF0000'; leds2.blink();
      leds1.color( colorLeds1 ); leds2.color( colorLeds2 );
      setTimeout(function() { motor1.forward(170); }, 400);
      setTimeout(function() { motor1.stop(); }, 4000);
    }
    if( tipo == 'triste' ){ 
      colorLeds1 = '#0000FF'; colorLeds2 = '#0000FF';
      leds1.color( colorLeds1 ); leds2.color( colorLeds2 );
      setTimeout(function() { leds1.intensity(120); leds2.intensity(120); }, 500);
      setTimeout(function() { leds1.intensity(50); leds2.intensity(50); }, 1100);
      setTimeout(function() { leds1.intensity(5); leds2.intensity(5); }, 1700);
      setTimeout(function() { leds1.intensity(0); leds2.intensity(0); }, 2300);
      setTimeout(function() { leds1.intensity(10); leds2.intensity(10); }, 2900);
    }    
  }
  gesto('normal');
  
  button.on("press", function() { console.log('btn'); }); 
  // Listen to the web socket connection
  io.on('connection', function(client) {        
    client.on('join',function(data){ console.log(data); }); // Registrar conexión exitosa con el servidor
    client.on('log', function(txt) { console.log(txt); }); // Imprimir en consola
    // Gestos
    client.on('none', function(txt) { gesto('normal') });
    client.on('happy', function(txt) { gesto('feliz') });
    client.on('mad', function(txt) { gesto('enojado') });
    client.on('sad', function(txt) { gesto('triste') });
    // Solicitud de Hablar
    button.on("press", function() {        
      client.emit('escuchar');
      console.log('btn2');
    });
  });
});

const port = process.env.PORT || 3000;
server.listen(port);