//$(function() {
var gamepad;

var gamepadButtonsState = []
var gamepadAxesState = []

var gamepadObj = {};


var rAF = window.requestAnimationFrame;

var initGamepad = function() {
	if (navigator.getGamepads){
    if (navigator.getGamepads()[0]) {
      //console.log("FOUND GAMEPAD!!!")
      //gamepad = navigator.getGamepads()[0];
      rAF(updateStatus)
    }  
  }
}





function updateStatus() {
	//console.log("loop")

		gamepad = navigator.getGamepads()[0];
    for (var i=0; i<gamepad.buttons.length; i++) {
      var val = (gamepad.buttons[i].value>0);

      if (val !== gamepadButtonsState[i]) {
      	if (val == 0) {
      		var event = new CustomEvent('gamepadButtonUp', {detail: { 'button': i, 'value': 0 }});
      	}
				if (val == 1) {
      		var event = new CustomEvent('gamepadButtonDown', {detail: { 'button': i, 'value': 1 }});
				}      	
				document.dispatchEvent(event);

      	//console.log("button " + i + ": " + val)
      }

      gamepadButtonsState[i] = val;

      // if (val > 0) {
      // 	

      // }
      //console.log(val)


    }

    for (var i=0; i<gamepad.axes.length; i++) {
      var val = (gamepad.axes[i] !== 0);

      if (val !== gamepadAxesState[i]) {
      	if (val == 1) {
      		var event = new CustomEvent('gamepadAxesStart', {detail: { 'axes': i, 'value': 1 }});
      	}
				if (val == 0) {
      		var event = new CustomEvent('gamepadAxesStop', {detail: { 'axes': i, 'value': 0 }});
				}      	
				document.dispatchEvent(event);
      }

      gamepadAxesState[i] = val;

      // if (val > 0) {
      // 	

      // }
      //console.log(val)


    }




    //var axes = d.getElementsByClassName("axis");
	    // for (var i=0; i<controller.axes.length; i++) {
	    //   //var a = axes[i];
	    //   //a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
	    //   //a.setAttribute("value", controller.axes[i] + 1);
	    // }
  rAF(updateStatus);
}

//console.log("gamepad api yo!")

initGamepad();


//});