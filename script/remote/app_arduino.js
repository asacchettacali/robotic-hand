var five = require("johnny-five"),
	handToHand = require('../../lib/handToHandRemote'),
	http = require('http'),
	board, servo;

// ASSEGNO L'ARDUINO
board = new five.Board();

// ARRAY DEI SERVO MOTORI
var servoFinger = new Array();

// ASSEGNO LE FUNZIONI CHE POSSONO TORNARMI UTILI
handToHand = new handToHand();

/******************************************************************************************************************************/
/************************************* PARTE RELATIVA ALL'ARDUINO E AI SERVO MOTORI CONNESSI **********************************/
/******************************************************************************************************************************/

board.on("ready", function() {

	// DEFINISCO TUTTI I SERVO MOTORI COLLEGATI ALL'ARDUINO SULLE RELATIVE PORTE DIGITALI PWM
	servoFinger['mignolo'] = new five.Servo({
		pin: 3, // Servo 1
		range: [20, 160], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 20, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});

	servoFinger['anulare'] = new five.Servo({
		pin: 5, // Servo 3
		range: [20, 160], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 20, // if you would like the servo to immediately move to a degree
	center: false // overrides startAt if true and moves the servo to the center of the range
	});

	servoFinger['medio'] = new five.Servo({
		pin: 6, // Servo 5
		range: [20, 160], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 20, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});

	servoFinger['pollice'] = new five.Servo({
		pin: 9, // Servo 2
		range: [20, 90], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 90, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});

	servoFinger['indice'] = new five.Servo({
		pin: 10, // Servo 4
		range: [20, 160], // Default: 0-180
		type: "standard", // Default: "standard". Use "continuous" for continuous rotation servos
		startAt: 160, // if you would like the servo to immediately move to a degree
		center: false // overrides startAt if true and moves the servo to the center of the range
	});



	setInterval(function(){

		handToHand.remoteReadLastData(servoFinger);

	}, 10); 


}); // CHIUSURA BOARD READY

