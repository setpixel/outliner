// $(function() {





//   var buttonHeldIntervalID;

//   document.addEventListener('gamepadButtonDown', function (event) { 
//     switch (event.detail.button) {
//       case 0:
//         toggleNodeType(selectedItem);
//         break;

//       case 13:
//         selectedItem++;
//         $(".selected").toggleClass("selected", false)
//         $("#" + nodes[selectedItem].id).toggleClass( "selected", true );

//         break;
//       case 12:
//         selectedItem--;
//         $(".selected").toggleClass("selected", false)
//         $("#" + nodes[selectedItem].id).toggleClass( "selected", true );
//         break;
//       case 6:
//         clearInterval(buttonHeldIntervalID);
//         buttonHeldIntervalID = window.setInterval(lTriggerDown, 20);
//         break;
//       case 7:
//         clearInterval(buttonHeldIntervalID);
//         buttonHeldIntervalID = window.setInterval(rTriggerDown, 20);
//         break;



//     }

//     console.log(event.detail.button) 
//   }, false);

//   document.addEventListener('gamepadButtonUp', function (event) { 
//     switch (event.detail.button) {
//       case 6:
//         clearInterval(buttonHeldIntervalID);
//         break;
//       case 7:
//         clearInterval(buttonHeldIntervalID);
//         break;
//     }
//   }, false);

//   var axesIntervalID = [];

//   document.addEventListener('gamepadAxesStart', function (event) { 
//     console.log("START")
//     switch (event.detail.axes) {
//       case 0:
//         clearInterval(axesIntervalID[0])
//         axesIntervalID[0] = window.setInterval(scrollWindowAxes, 15, 0)
//         break;
//       case 1:
//         clearInterval(axesIntervalID[1])
//         axesIntervalID[1] = window.setInterval(scrollWindowAxes, 15, 1)
//         break;
//     }
//   }, false);

//   document.addEventListener('gamepadAxesStop', function (event) { 
//     console.log("STOPPPP")
//     switch (event.detail.axes) {
//       case 0:
//         clearInterval(axesIntervalID[0]);
//         break;
//       case 1:
//         clearInterval(axesIntervalID[1]);
//         break;
//     }
//   }, false);

//   var lTriggerDown = function() {
//     //console.log(gamepad.buttons[6])
//     changeScale(1-(gamepad.buttons[6].value/20));
//   }

//   var rTriggerDown = function() {
//     changeScale(1+(gamepad.buttons[7].value/20));
//   }


//   var scrollPosition = [0,0];


//   var scrollWindowAxes = function(axes) {
//     console.log(scrollPosition)
//     console.log(gamepad.axes[axes])

//     scrollPosition[axes] = scrollPosition[axes] + (gamepad.axes[axes]*50)

//     if (axes) {
//       $('body').scrollTop(scrollPosition[axes])
//     } else {
//       $('body').scrollLeft(scrollPosition[axes])
//     }
   
//   }



//   $('body').keydown(function(event) {
//     if (event.keyCode == 40 || event.keyCode == 38 || event.keyCode == 13 || event.keyCode == 9) {
//       event.preventDefault();
//     }

//     console.log( event );

//     switch (event.keyCode) {
//       case 40: 
//         selectedItem++;
//         $(".selected").toggleClass("selected", false)
//         $("#" + nodes[selectedItem].id).toggleClass( "selected", true );

//         break;
//       case 38:
//         selectedItem--;
//         $(".selected").toggleClass("selected", false)
//         $("#" + nodes[selectedItem].id).toggleClass( "selected", true );
//         break;
//       case 13:
//         addNode(selectedItem);
//         break;
//       case 9:
//         toggleNodeType(selectedItem);
//         break;
//       case 27:
//         console.log(JSON.stringify(nodes));
//         break;
//       case 82:
//         reflowScreen();
//         break;
//     }
//   });


//   var changeScale = function(amount) {
//     scale = scale * amount;
//     $("#canvas").css("transform", "translate3d(0,0,0) scale(" + scale + ")")
//     reflowScreen();

//   }



