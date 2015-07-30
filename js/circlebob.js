;(function() {
  'use strict';

  var currentLoc = [0,0];
  var velocity = [0,0];
  var destLoc = [0,0];

  var n_acceleration = 0.1;
  var n_elasticity = 0.001;
  var n_dampening = 0.95;

  var acceleration = 0;
  var elasticity = 0;
  var dampening = 0;

  var recovery = 0.1;

  var scale = 1;
  var scaleVel = 0;
  var scaleDamp = 0.9;

  var opacity = 0;

  var idle = true;

  var looping = false;

  var animReq;

  var hoverTowards = function(x, y) {
    destLoc = [x,y];
  }

  var flyTowards = function(x, y) {
    destLoc = [x,y];
    acceleration = 0.4;
    elasticity = 1;
    dampening = 0.7;
  }

  var ping = function(x,y) {
    looping = false;
    scale = 0.4;
    scaleVel = 0.6;
    currentLoc = [x,y];
    destLoc = [x,y];
    opacity = 1;
    if (idle) {
      window.requestAnimationFrame(mainLoop);
      $("#circle-bob").show()
    }
  }

  var echo = function(x,y) {
    looping = true;
    window.cancelAnimationFrame(animReq);
    scale = 0.2;
    scaleVel = 0.2;
    if (x) {
      currentLoc = [x,y];
      destLoc = [x,y];     
    }
    opacity = 1;
    if (idle) {
      animReq = window.requestAnimationFrame(mainLoop);
      $("#circle-bob").show()
    }
  }

  var mainLoop = function(timestamp) {

    var currentVelocity = [(destLoc[0]-currentLoc[0]) * acceleration, (destLoc[1]-currentLoc[1]) * acceleration]

    velocity[0] += currentVelocity[0] * elasticity;
    velocity[1] += currentVelocity[1] * elasticity;

    acceleration += ((n_acceleration - acceleration) * 0.001);
    elasticity += (n_elasticity - elasticity) * 0.01;
    dampening += (n_dampening - dampening) * 0.01;


    currentLoc[0] += velocity[0]
    currentLoc[1] += velocity[1]
    velocity[0] *= dampening;
    velocity[1] *= dampening;




    $("#circle-bob").css('left', currentLoc[0] -50);
    $("#circle-bob").css('top', currentLoc[1] -50);



    scale += scaleVel;
    scale *= scaleDamp;

    opacity *= .88;

    $("#circle-bob").css("transform", "translate3d(0,0,0) scale(" + scale + ")");
    $("#circle-bob").css("opacity", opacity);

    if (opacity > 0.03) {
      animReq = window.requestAnimationFrame(mainLoop);
    } else {
      if (looping) {
        window.cancelAnimationFrame(animReq);
        echo();
      } else {
        $("#circle-bob").hide()
      }
    }
  } 

  window.circleBob = {
    hoverTowards: hoverTowards,
    flyTowards: flyTowards,
    echo: echo,
    ping: ping
  }
  
  $( function() { 
    window.requestAnimationFrame(mainLoop);
  });


}).call(this);