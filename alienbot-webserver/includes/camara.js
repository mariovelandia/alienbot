var video = document.querySelector('#camera-stream'),
	image = document.querySelector('#snap'),
	start_camera = document.querySelector('#start-camera'),
	controls = document.querySelector('.controls'),
	take_photo_btn = document.querySelector('#take-photo'),
	delete_photo_btn = document.querySelector('#delete-photo'),
	download_photo_btn = document.querySelector('#download-photo'),
	error_message = document.querySelector('#error-message');

navigator.getMedia = ( navigator.getUserMedia ||
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia ||
navigator.msGetUserMedia);

if(!navigator.getMedia){
	displayErrorMessage("Your browser doesn't have support for the navigator.getUserMedia interface.");
} else {
	// Request the camera.
	navigator.getMedia(
		{
			video: true
		},
		// Success Callback
		function(stream){
			video.src = window.URL.createObjectURL(stream);
			video.play();
			video.onplay = function() {
				showVideo();
			};
		},
		// Error Callback
		function(err){
			displayErrorMessage("There was an error with accessing the camera stream: " + err.name, err);
		}
	);

}

// Mobile browsers start it manually.
start_camera.addEventListener("click", function(e){
	e.preventDefault();
	// Start video playback manually.
	video.play();
	showVideo();
});

function takePhoto(){	
	var snap = takeSnapshot();
	// Show image. 
	image.setAttribute('src', snap);
	image.classList.add("visible");
	// Enable delete and save buttons
	delete_photo_btn.classList.remove("disabled");
	download_photo_btn.classList.remove("disabled");
	// Set the href attribute of the download button to the snap url.
	download_photo_btn.href = snap;
	// Save image
	var filename = Date.now();
	$.ajax({
		type: "POST",
		url: "includes/camsave.php",
		data: { 
			fileName: filename,
			imgBase64: snap,
		}
	}).done(function(msg) {
		console.log('saved');  			
	});
	
	//
	const clarifai = new Clarifai.App({
	 apiKey: 'd42c1015131848f2945a7e2ccf698029'
	});

	var DemographicsModel = 'c0c0ac362b03416da06ab3fa36fb58e3';		
	var imgencode = snap.replace("data:image/png;base64,","");  

	clarifai.models.predict( DemographicsModel, {base64: imgencode}).then(
		function(response) {       
			displayDemographics(response, imgencode);			
		},
		function(err) {
			console.log('Error clarifai');
			console.log(err);
		}
	);	

	// Pause video playback of stream.
	video.pause();
}

take_photo_btn.addEventListener("click", function(e){
	e.preventDefault();
	respond('Uy tu tui, dejamé y averiguo de ti en el disco duro de mi nave espacial');
	takePhoto();
});

delete_photo_btn.addEventListener("click", function(e){
	e.preventDefault();
	// Hide image.
	image.setAttribute('src', "");
	image.classList.remove("visible");
	// Disable delete and save buttons
	delete_photo_btn.classList.add("disabled");
	download_photo_btn.classList.add("disabled");
	// Resume playback of stream.
	video.play();

});

function showVideo(){
	// Display the video stream and the controls.
	hideUI();
	video.classList.add("visible");
	controls.classList.add("visible");
}

function takeSnapshot(){
	// Here we're using a trick that involves a hidden canvas element.  
	var hidden_canvas = document.querySelector('canvas'),
			context = hidden_canvas.getContext('2d');
	var width = video.videoWidth,
			height = video.videoHeight;
	if (width && height) {
		// Setup a canvas with the same dimensions as the video.
		hidden_canvas.width = width;
		hidden_canvas.height = height;
		// Make a copy of the current frame in the video on the canvas.
		context.drawImage(video, 0, 0, width, height);
		// Turn the canvas image into a dataURL that can be used as a src for our photo.
		return hidden_canvas.toDataURL('image/png');
	}
}

function displayErrorMessage(error_msg, error){
	error = error || "";
	if(error){ console.log(error); }
	error_message.innerText = error_msg;
	hideUI();
	error_message.classList.add("visible");
}

function hideUI(){
	// Helper function for clearing the app UI.
	controls.classList.remove("visible");
	start_camera.classList.remove("visible");
	video.classList.remove("visible");
	snap.classList.remove("visible");
	error_message.classList.remove("visible");
}     

function displayDemographics(data, imgencode) {  
	var age_appearance = data.outputs[0].data.regions[0].data.face.age_appearance.concepts;
	var ageAppearance = age_appearance[0].name;
	var gender_appearance = data.outputs[0].data.regions[0].data.face.gender_appearance.concepts;
	var genderAppearance = gender_appearance[0].name;
	var multicultural_appearance = data.outputs[0].data.regions[0].data.face.multicultural_appearance.concepts;
	var multiculturalAppearance = multicultural_appearance[0].name;
	$('#age span').html( ageAppearance ).slideDown();
	$('#gender span').html( genderAppearance ).slideDown();
	$('#etnic span').html( multiculturalAppearance ).slideDown();
	
	respond('Mi instinto alienigena me dice que tienes alrededor de los '+ ageAppearance);
	
	if( genderAppearance == 'masculine' ){ var genderAppearanceTxt = 'hombre'; }
	if( genderAppearance == 'feminine' ){ var genderAppearanceTxt = 'mujer'; }
	
	setTimeout(function() { respond('De seguro eres '+ genderAppearanceTxt); }, 3000);
	
	if( multiculturalAppearance == 'hispanic, latino, or spanish origin' ){ 
		var multiculturalAppearanceTxt = 'hispano, latino, ó de desendencia de habla hispana'; 
	} else if( multiculturalAppearance == 'white' ){ 
		var multiculturalAppearanceTxt = 'blanco, no me digas... gringo?'; 
	}
	// asian
	// middle eastern or north african
	// american indian or alaska native
	// black or african american
	// native hawaiian or pacific islander
	setTimeout(function() { respond('Y la tu raza humana es de desendecia '+ multiculturalAppearanceTxt ); }, 6000);
	setTimeout(function() { 
		image.setAttribute('src', "");
		image.classList.remove("visible");
		// Disable delete and save buttons
		delete_photo_btn.classList.add("disabled");
		download_photo_btn.classList.add("disabled");        
		setTimeout(function() {
			respond('No te veo gordito suficiente. Ve y come arto');
			video.play();
			hideAllDivs();
			$('#dialog-container').slideDown();
			
			const clarifai = new Clarifai.App({
			 apiKey: 'e894a92f44494349b0644eaeac5dd6e3'
			});
			var GeneralModel = 'aaa03c23b3724a16a56b629203edc62c';
			clarifai.models.predict( GeneralModel, {base64: imgencode}).then(
				function(response) {
					setTimeout(function() { displayGeneral(response); }, 3000);					
				},
				function(err) {
					console.log('Error clarifai');
					console.log(err);
				}
			);
		}, 1500);    
	}, 10000);
}

function displayGeneral(data) {  
	var allConcepts = 'Noto en ti: ';
	var concepts = data.outputs[0].data.concepts;
	for (var i = 0; i < concepts.length; i++) {
	  if( concepts[i].value > 0.9 && concepts[i].name != 'undefined' && concepts[i].name != 'relación (relación)' ){	  	
	  	allConcepts += concepts[i].name + ', ';
	  }
	}
	respond( allConcepts );
}