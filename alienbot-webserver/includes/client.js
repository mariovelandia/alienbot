var accessToken = "5ce472256274467996e9dd704d60c843",
    baseUrl = "https://api.api.ai/v1/",
    $speechInput = $("#speech"),
    $recBtn = $("#rec"),
    $photoBtn = $('#whoiam'),
    recognition,
    messageRecording = "Escuchando...",
    messageCouldntHear = "No te escucho humano! Repite de nuevo",
    messageInternalError = "Ups, necesito a mis creadores",
    messageSorry = "Lo siento, soy alien bebe y aún no se la respuesta a eso.";
    
$(document).ready(function() {

    $speechInput.keypress(function(e) { 
        if (event.which == 13) { 
            e.preventDefault(); send(); 
            $(this).val('');
        } 
    });
    $recBtn.on("click", function(event) { 
        switchRecognition(); 
    });
    $photoBtn.on("click", function(event) { 
        hideAllDivs();
        $('#photo-container').slideDown();
    });
    $(".debug__btn").on("click", function() { 
        $(this).next().toggleClass("is-active"); 
    });
    socketEvents(); 

});
/*
 * Js de Reconocimiento de Imagen
*/
function startRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = function(event) {
        respond(messageRecording);
        updateRec();
    };
    recognition.onresult = function(event) {
        recognition.onend = null;
        var text = "";
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
        }
        setInput(text);
        stopRecognition();
    };
    recognition.onend = function() {
        respond(messageCouldntHear);
        stopRecognition();
    };
    recognition.lang = "es-ES";
    recognition.start();
}

function stopRecognition() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    updateRec();
}
function switchRecognition() {
    if (recognition) {
        stopRecognition();
    } else {
        startRecognition();
    }
}
function setInput(text) {
    $speechInput.val(text);
    send();
}
function updateRec() {
    $recBtn.text(recognition ? "Parar" : "Grabar");
}

function send() {
    var text = $speechInput.val();
    $.ajax({
      type: "POST",
      url: baseUrl + "query",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      headers: {
         "Authorization": "Bearer " + accessToken
      },
      data: JSON.stringify({query: text, lang: "en", sessionId: "yaydevdiner"}),
        success: function(data) {           
            processResponse(data);
        },
      error: function() {
         respond(messageInternalError);
      }
    });
}
function prepareResponse(val) {
    var debugJSON = JSON.stringify(val, undefined, 2),
        spokenResponse = val.result.speech;
    respond(spokenResponse);
    debugRespond(debugJSON);
}
function debugRespond(val) {
    $("#response").text(val);
}
function respond(val) {
    if (val == "") {
      val = messageSorry;
    }
    if (val !== messageRecording) {
        var msg = new SpeechSynthesisUtterance();
        msg.voiceURI = "native";
        msg.text = val;
        msg.lang = "es-CO";
        window.speechSynthesis.speak(msg);
    }
    $("#spokenResponse").addClass("is-active").find(".spoken-response__text").html(val);
}
/*
 * 
*/
function hideAllDivs() {
    $('#dialog-container').hide();
    $('#video-container').hide();
    $('#photo-container').hide();
}
function mostrarGesto( gesto ) {
    // cuestionado / normal / pendinte / tierno / triste
    var socket = io.connect('http://localhost:' + 3000);
    $('img.face').attr('src','includes/img/'+ gesto +'.png');
    if (gesto == 'normal') {
        socket.emit('none', '');
        console.log('Gesto Normal');
    } else if (gesto == 'feliz') {
        socket.emit('happy', '');
        console.log('Gesto Feliz');
    } else if (gesto == 'triste') {
        socket.emit('sad', '');
        console.log('Gesto Triste');
    } else if (gesto == 'enojado') {
        socket.emit('mad', '');
        console.log('Gesto Enojado');
    }    
}

function imitateArtist(artist, data) {
    var iframeVideo = '';
    if( artist == 'bomba estereo'){
        iframeVideo = '<iframe width="100%" height="465" src="https://www.youtube.com/embed/bxWxXncl53U?start=33&autoplay=1" frameborder="0" allowfullscreen></iframe>';        
    } else {        
        mostrarGesto('triste');
        respond('Ups.. Ese Artista no..')
    }
    respond('Tu lo has pedido');    
    setTimeout(function() {
        hideAllDivs();
        $('#video-container').html( iframeVideo ).slideDown();
    }, 2000);       
    setTimeout(function() {
        $('#video-container').empty(); hideAllDivs();
        $('#dialog-container').slideDown();
        respond('¿Te Gustó?');
        setTimeout(function() { prepareResponse(data); }, 1000);
        setTimeout(function() {
            mostrarGesto('normal');
            $('.spoken-response__text').html('');
            console.log('normal');
        }, delay + 6500);
    }, 25000);
    
}

function endConversation(gesto, txt, delay) {
    setTimeout(function() {
        respond( txt );
        mostrarGesto( gesto );
    }, delay);
    setTimeout(function() {
        mostrarGesto('normal');
        $('.spoken-response__text').html('');
        console.log('normal');
    }, delay + 6500);
}

function processResponse( data ){   
    var action = data.result.action;
    var parameters = data.result.parameters;    
    if( action == 'general.greetings' && parameters.given_name != '' ){
        mostrarGesto('pendiente');
        prepareResponse(data);        
    } else if( action == 'app.comming-next' && parameters.tellme != '' ){
        mostrarGesto('feliz');
        prepareResponse(data);
        endConversation('triste','¿No me vas a preguntar nada más humano?', 5000);
    } else if ( action == 'app.activities' && parameters.decision != '' ) {
        if (parameters.decision == 'Si') {
            mostrarGesto('enojado');
            respond('Caminar en exceso te hace flaco, más bien ve por tus tacos');
            endConversation('enojado','¿Qué otra cosa quieres saber?',5000);
        } else {
            mostrarGesto('feliz');
            respond('Recuerda que comer y no caminar ayuda a combatir la depresión y aún más, ve por unos tacos.');
            endConversation('feliz','¿Qué otra cosa quieres saber?',7000);
        }
    } else if ( action == 'app.today-artists' ) {
        mostrarGesto('feliz');
        prepareResponse(data);
        endConversation('feliz','Aunque a mi me gusta más la variedad de comida que hay en este planeta. Tu te ves de rechupete.', 8000);
    } else if ( action == 'app.recomend-artist' && parameters.tellme != '' ) {
        mostrarGesto('feliz');
        prepareResponse(data);
        endConversation('normal','¿Quieres saber otra cosa?', 5000);
    } else if ( action == 'app.funfact' && parameters.artist != '' ) {
        mostrarGesto('normal');
        prepareResponse(data);
        endConversation('feliz','También tienes que saber que hay más de 20 lugares para saciar el apetito … No te antoja un helado que se derrita lentamente en tu boca de mimos?', 9000);
    } else if( action == 'app.imitation' && parameters.stereopicnic_artistas != '' ){
        imitateArtist( parameters.stereopicnic_artistas, data );
    } else if ( action == 'app.wc' ) {
        if ( parameters.disculpas != '') {
            mostrarGesto('normal');
            prepareResponse(data);
            endConversation('normal','¿Quieres saber otra cosa?', 5000);
        } else {
            mostrarGesto('enojado');
            prepareResponse(data);
        }
    } else if ( action == 'app.foodcourt' ) {
        mostrarGesto('feliz');
        prepareResponse(data);
        endConversation('feliz','Te invito a cenar conmigo hoy.', 5000);
    } else if ( action == 'general.joke' ) {
        mostrarGesto('feliz');
        prepareResponse(data);
        endConversation('enojado','¿Quieres saber algo más? pregunta menos y come más!', 11000);
    } else if ( action == 'app.howami' ) {
        mostrarGesto('normal');
        respond('Que buena pregunta. Más de lo que piensas.')
        setTimeout(function() { takePhoto(); }, 1500);
    } else {
        prepareResponse(data);
    }
}
function socketEvents() {
    var socket = io.connect('http://localhost:' + 3000);
    // Validar conexión
    socket.on('connect', function(data) { 
        console.log('Arduino Conectado!');
        socket.emit('join', 'Client esta conectado!'); 
    });
    // Activar microfono
    socket.on('escuchar', function(){        
        console.log('Escuchando');
        $('#rec').click();
    });
    // Enviar Respuesta
    socket.on('respuesta', function(data){
        console.log('Respuesta Enviada');
        $('#speech').val( data );
        send(); 
        setTimeout(function() { $('#rec').click(); $('#speech').val(''); }, 1500);
    });
}