/*
	
zoinks!!!


  http://localhost:8000/?id=0B0Pyam8wfFCMMFVjeHVTTGxqbU0/

  TODAYS BUGS:
    //reflow after image loads
    //update the card after updating the image
    //reflow on window resize
  
  NEXT FEATURES:
    //button for auth
    //fullscreen
    //scale to fit the screen
    stats display
    add printing capability
    detail view for editing



  TODO:
    make sure auth is a button initiated by a click event 

    select node with cursor
    drag and drop reordering
    make all fields editable
    arrow keys left and right

    UI
      different view that reflows differently
      make ui to scale view
      make view reflow to wrap at the bottom of the screen
      ***reflow when node changes size from edit
      add padding to right side of the dom

    NODE OPERATIONS:
      delete
      add and bind
      reorder and bind
      enter information
  
    TECH STUFF:
      google realtime api
      joystick api
      
    VIEWS:
      single view mode
      linear
      break
      timeline

    FILTER:
      tags

    Color the nodes?

    what is the ui to add more metadata to a node?


    Screensaver mode

    collaborator's selected node
    collaborator's cursor

  IMPORT/EXPORT

    need to import a script or a ordered list
      script: 
        fountain
        final draft
    export
      prints
      excel
      fountain
      


  Thoughts: 
    Are beats the most important part of the story? Or scenes?

    There can be beats in a scene? But can there be beats in a beat?

    Do beats have a type? Character or Plot?



*/

//var Outliner = Outliner || {};

;(function() {
  'use strict';

  var nodes;
  var scale = 1.5;

  var selectedItem = 0;
  var insertLocation;

  var dragItem = null;
  var dragOffset;
  var dragTimeoutID;


  var init = function() {
    console.log("Init!");
    // maybe not much to do here. should load externally from the model
  }

  var load = function(outlineNodes) {
    var htmlList = [];
    for (var i = 0; i < outlineNodes.length; i++) {
      htmlList.push(displayNodeHTML(outlineNodes.get(i)));
    };
    $("#canvas").append(htmlList.join(''));

    // attach a listener to the text
    for (var i = 0; i < outlineNodes.length; i++) {
      // attach node event listeners
      attachEventListenersToNode(outlineNodes.get(i).id)
    }




    reflowScreen();
    //setTimeout(reflowScreen, 1000);
    setTimeout(scaleToFit, 1000);
    changeScale(1);
  }

  var attachEventListenersToNode = function(nodeID) {
    setTimeout(function() {

      $("#" + nodeID + " .title").on("input", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray()
        var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        node.title = $(event.target).text()
      });
    
      $("#" + nodeID).on("mousedown", function(event) {
        selectItemByID(event.currentTarget.id)

        if (!$(event.target).attr("contenteditable")) {
          dragItem = $(event.currentTarget);

          dragTimeoutID = setTimeout(function() {dragItem.toggleClass( "dragged", true )}, 100);

          if (event.currentTarget !== event.target) {
            // clicked on an item within the card
            dragOffset = [(event.target.offsetLeft)*scale+(event.offsetX*scale)+10, (event.offsetY+event.target.offsetTop)*scale];
          } else {
            dragOffset = [event.offsetX*scale, event.offsetY*scale];
          }
        }
      });

      $("#" + nodeID).on('drop', function (e) {
        e.stopPropagation();
        e.preventDefault();

        console.log("im here")


        var files = e.originalEvent.dataTransfer.files;
        if (files.length === 1) {
        var file = files[0];



          // check to make sure it's an image.

          if ($.inArray(file.type, ['image/gif', 'image/jpg', 'image/jpeg', 'image/png']) != -1) {
            // upload it!

            awsUploader.upload(file, nodeID);
          }


        }





        //var items = e.dataTransfer.items;
        // for (var i = 0; i < items.length; ++i) { 
        //   if (items[i].kind != "file")
        //      continue;
     
        //   var entry = items[i].webkitGetAsEntry();    // WebKit/chromium needs 'webkit' prefix (since Chrome 21)
      
        //  // import the dropped files/folders into temporary filesystem
        //  entry.copyTo(temporaryFs.root, entry.name, successCallback, errorCallback);
        console.log(files)

      });


    }, 200);
  }

  var displayNodeHTML = function(obj) {
    var htmlList = [];
    switch (obj.type) {
      case "section":
        htmlList.push('<div class="section" id="' + obj.id + '"><div class="title" contenteditable="true" spellcheck="false">' + obj.title + '</div></div>');
        break;
      case "beat":
        htmlList.push('<div class="card beat" id="' + obj.id + '">');
        if (obj.imageURL) {
          htmlList.push('<img src="' + obj.imageURL + '">');
        }
        htmlList.push('<div class="title" contenteditable="true" spellcheck="false">' + obj.title + '</div>');
        if (obj.synopsis) {
          htmlList.push('<div class="synopsis">' + obj.synopsis + '</div>');
        }
        htmlList.push('</div>');
        break;
      case "note":
        htmlList.push('<div class="card note" id="' + obj.id + '">');
        htmlList.push('<div class="title" contenteditable="true" spellcheck="false">' + obj.title + '</div>');
        htmlList.push('</div>');
        break;
      case "scene":
        htmlList.push('<div class="card scene" id="' + obj.id + '">');
        if (obj.setting) {
          htmlList.push('<div class="setting">' + obj.setting + '</div>');
        }
        if (obj.timeOfDay) {
          htmlList.push('<div class="time-of-day">' + obj.timeOfDay + '</div>');
        }
        htmlList.push('<div class="clear"></div>');
        if (obj.imageURL) {
          htmlList.push('<img src="' + obj.imageURL + '">');
        }
        htmlList.push('<div class="title" contenteditable="true" spellcheck="false">' + obj.title + '</div>');
        if (obj.synopsis) {
          htmlList.push('<div class="synopsis">' + obj.synopsis + '</div>');
        }
        htmlList.push('</div>');
        break;
    }
    return htmlList.join('');
  };

  var reflowScreen = function() {
    var yCursor = 0;
    var xCursor = 0;

    //setTimeout(function() {
      var nodes = realtimeModel.outlineNodesAsArray()

      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].type == "section" && i !== 0) {
          yCursor = 0;
          xCursor += 200+30;
        }

        if ((yCursor+$("#" + nodes[i].id).outerHeight()+10) > (($( window ).height()/scale)-10)) {
          yCursor = 23;
          xCursor += 200+10;          
        }

        $("#" + nodes[i].id).css("top", yCursor);
        $("#" + nodes[i].id).css("left", xCursor);

        yCursor += $("#" + nodes[i].id).outerHeight() + 10;
        $("#" + nodes[i].id).css("visibility", "visible");
      }

      return {lastXCursor: xCursor, lastWidth: 200+30};
    //}, 100);
  };

  var selectItemByID = function(id) {
    var nodes = realtimeModel.outlineNodesAsArray();
    var node = $.grep(nodes, function(e){ return e.id == id })[0];
    selectedItem = nodes.indexOf(node);
    selectItem();
  }


  var selectItem = function(forceTimeout) {
    var nodes = realtimeModel.outlineNodesAsArray();
    $(".selected").toggleClass("selected", false);
    $("#" + nodes[selectedItem].id).toggleClass( "selected", true );
    if (nodes[selectedItem].title == "") {
      if ((Date.now()-Number(nodes[selectedItem].id)) < 1000 || forceTimeout) {
        setTimeout(function(){$("#" + nodes[selectedItem].id + " .title").focus();}, 100)
      } else {
        $("#" + nodes[selectedItem].id + " .title").focus();
      }
      
    } else {
      $(".title").blur();
    }
    
  }


  $('body').keydown(function(event) {
    if (event.keyCode == 40 || event.keyCode == 38 || event.keyCode == 13 || event.keyCode == 9 || (event.keyCode == 8 && event.metaKey) || (event.keyCode == 187 && event.metaKey) || (event.keyCode == 189 && event.metaKey)) {
      event.preventDefault();
    }

    console.log( event );

    var nodes = realtimeModel.outlineNodesAsArray()
      // TODO: ADD LEFT ARROW, RIGHT ARROW
      // down arrow
    switch (event.keyCode) {
      case 40: 
        if (event.metaKey) {
          realtimeModel.move(selectedItem, selectedItem+2);
          selectedItem = selectedItem+1;
          reflowScreen();
        } else {
          selectedItem++;
          selectItem();
        }
        break;
      // up arrow  
      case 38:
        if (event.metaKey) {
          realtimeModel.move(selectedItem, selectedItem-1);
          selectedItem = selectedItem-1;
          reflowScreen();
        } else {
          selectedItem--;
          selectItem();
        }
        break;
      // enter
      case 13:
        addRemoteNode(selectedItem);
        break;
      // tab
      case 9:
        toggleNodeType(selectedItem);
        break;
      // p?
      case 27:
        console.log(JSON.stringify(nodes));
        break;
      case 82:
        reflowScreen();
        break;
      // backspace
      case 8:
        // the command key needs to be down
        if (event.metaKey) {
          removeRemoteNode(selectedItem);
        }
        break;
      // 0 for fullscreen
      case 48:
        if (event.metaKey) {
          if (document.webkitIsFullScreen) {
            document.webkitExitFullscreen();
          } else {
            document.documentElement.webkitRequestFullscreen();
          }
          
        }
        break;
      case 187: 
        if (event.metaKey) {
          changeScale(1.3);
        }
        break;
      case 189:
        if (event.metaKey) {
          changeScale(0.8);
        }
        break;
    }
  });

  var scaleToFit = function() {
    var screenWidth = $(window).width();
    scale = 0.1;
    for (var i = 0; i < 100; i++) {
      scale += 0.02;
      var reflowValues = reflowScreen();
      if (screenWidth > ((reflowValues.lastXCursor + reflowValues.lastWidth + (200))*scale)) {
        //console.log("still too small")
      } else {
        break;
      }
    }
    $("#canvas").css("transform", "translate3d(0,0,0) scale(" + scale + ")")
    reflowScreen();
  };

  $(document).on("selectstart", function(event) {
    if (dragItem) {
      return false;
    }
  });

  var findOrderAt = function(x, y, ignoreSelectedItem) {
    // go through all nodes, find x,y and width and height
    // is xy on the node? great! stop
    // if not, what is the closest node?

    var border = (5*scale);

    var nodes = realtimeModel.outlineNodesAsArray()

    var lastFoundColumnItem = null;

    for (var i = 0; i < nodes.length; i++) {
      if (ignoreSelectedItem && i == selectedItem) {
      
      }
      else {
        var domNode = $("#" + nodes[i].id);

        var posX = domNode.offset().left;
        var posY = domNode.offset().top;
        var width = domNode.outerWidth(true)*scale;
        var height = domNode.outerHeight(true)*scale;

        if (x >= (posX-border) && x <= (posX + width + border + (22*scale)) && y >= (posY-border) && y <= (posY + height+(100*scale))) {
          lastFoundColumnItem = i;
        }

        if (x >= (posX-border) && x <= (posX + width + border) && y >= (posY-border) && y <= (posY + height + border)) {
          //console.log(i, nodes[i].title)

          if (x > (posX+(height/2))) {
            return i + 1
          } else {
            return i;
          }


         
        }        
      }


    }

    if (!lastFoundColumnItem) {
      return selectedItem;
    } else {
      console.log("last found")
      return lastFoundColumnItem;
    }


    
    //return i

    // console.log($(document.elementFromPoint(x, y)).is(".card"));
  }


  var findOrderAt2 = function(x, y, _insertLocation) {
    var yCursor = 0;
    var xCursor = 0;

    var border = (5);

    var nodes = realtimeModel.outlineNodesAsArray()

    x = x / scale;
    y = y / scale;

    var selectedID = nodes[selectedItem].id;

    if (_insertLocation >= 0) {
      var item = nodes.splice(selectedItem, 1)[0]
      nodes.splice(_insertLocation, 0, item)
    }


    var lastFoundColumnItem;


    for (var i = 0; i < nodes.length; i++) {



      if (nodes[i].type == "section" && i !== 0) {
        yCursor = 0;
        xCursor += 200+30;
      }

      if ((yCursor+$("#" + nodes[i].id).outerHeight()+10) > (($( window ).height()/scale)-10)) {
        yCursor = 23;
        xCursor += 200+10;          
      }





      var posX = xCursor;
      var posY = yCursor;
      var width = 230;
      var height = $("#" + nodes[i].id).outerHeight();


      if (x >= (posX-border) && x <= (posX + width + border + (22*scale)) && y >= (posY-border) && y <= (posY + height+(100*scale))) {
        lastFoundColumnItem = i;
      }



      if (x >= (posX-border) && x <= (posX + width + border) && y >= (posY-border) && y <= (posY + height + border)) {
      
        console.log(nodes[i].title)
        return i;
      }


      yCursor += $("#" + nodes[i].id).outerHeight() + 10;


    }

    return lastFoundColumnItem;
  };









  var reflowScreenReordered = function(_insertLocation) {
    var yCursor = 0;
    var xCursor = 0;

    var nodes = realtimeModel.outlineNodesAsArray()

    var selectedID = nodes[selectedItem].id;

    if (_insertLocation >= 0) {

    var item = nodes.splice(selectedItem, 1)[0]

    nodes.splice(_insertLocation, 0, item)

    }


    for (var i = 0; i < nodes.length; i++) {

      if (nodes[i].type == "section" && i !== 0) {
        yCursor = 0;
        xCursor += 200+30;
      }

      if ((yCursor+$("#" + nodes[i].id).outerHeight()+10) > (($( window ).height()/scale)-10)) {
        yCursor = 23;
        xCursor += 200+10;          
      }


 
      if (nodes[i].id === selectedID) {
        
         yCursor += $("#" + nodes[i].id).outerHeight() + 10;
      } else {
        $("#" + nodes[i].id).css("top", yCursor);
        $("#" + nodes[i].id).css("left", xCursor);
        yCursor += $("#" + nodes[i].id).outerHeight() + 10;
      }

      



    }
  };





  $(document).on("mousemove", function(event) {

    //console.log(findOrderAt2(event.pageX, event.pageY))
    

    if (dragItem) {
      dragItem.toggleClass( "dragged", true )
      dragItem.css("top", ((event.pageY-20-dragOffset[1])/scale));
      dragItem.css("left", ((event.pageX-20-dragOffset[0])/scale));
      $(".title").blur();

      insertLocation = (findOrderAt2(event.pageX, event.pageY));
      insertLocation = (findOrderAt2(event.pageX, event.pageY, insertLocation));

      // console.log(selectedItem)
      // console.log(insertLocation)

      reflowScreenReordered(insertLocation);

    }

    //console.log(event.pageX, event.pageY);
  });


  $(document).on("mouseup", function(event) {

    if (dragItem) {
      console.log("selected item: " + selectedItem)
      console.log("insert: " + insertLocation)

      if ((selectedItem !== insertLocation) && insertLocation ) {



        // issue reorder to model
        if (selectedItem > insertLocation) {
          realtimeModel.move(selectedItem, insertLocation);
        } else {
          realtimeModel.move(selectedItem, insertLocation + 1);
        }

        
      }

      dragItem = null;
      $('.dragged').toggleClass( "dragged", false );

      reflowScreen();

      insertLocation = null;

    }

  });



  var changeScale = function(amount) {
    scale = scale * amount;
    $("#canvas").css("transform", "translate3d(0,0,0) scale(" + scale + ")")
    reflowScreen();
  }


  $( function() {

    $( window ).resize(function() {
      reflowScreen();
      //scaleToFit();
    });


    $('#toolbar').on("mousemove", function(event) {
      scale = ((event.offsetX+30)/100)*2;
      $("#canvas").css("transform", "translate3d(0,0,0) scale(" + scale + ")")
      reflowScreen();
    })


      $("html").on("dragover", function(event) {
          console.log("drag an image file over the node!")
          event.preventDefault();  
          event.stopPropagation();
          $(this).addClass('dragging');
      });

      $("html").on("dragleave", function(event) {
          event.preventDefault();  
          event.stopPropagation();
          $(this).removeClass('dragging');
      });

      $("html").on("drop", function(event) {
          event.preventDefault();  
          event.stopPropagation();
          $(this).removeClass('dragging');
      });






  })


  var updateImageURL = function(nodeID, imageURL) {
    var nodes = realtimeModel.outlineNodesAsArray();
    var node = $.grep(nodes, function(e){ return e.id == nodeID })[0];
    node.imageURL = imageURL;
    refreshNode(nodeID)
    console.log("updating image url: " + imageURL)
  }

  var refreshNode = function(nodeID) {
    var nodes = realtimeModel.outlineNodesAsArray();
    var node = $.grep(nodes, function(e){ return e.id == nodeID })[0];
    $("#" + node.id).remove();
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
    setTimeout(reflowScreen, 1500);
    //selectItemByID(node.id);
  }

  var toggleNodeType = function(index) {
    var nodes = realtimeModel.outlineNodesAsArray();
    var types = ["beat", "scene", "note", "section"]
    var newType = types[(types.indexOf(nodes[index].type)+1) % (types.length)]
    var node = nodes[index];
    node.type = newType;
    $("#" + node.id).remove();
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
    selectItem(true);
  }

  var changeLocalNodeType = function(node) {
    $("#" + node.id).remove();
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
  }




  var removeRemoteNode = function(index) {
    console.log("removing a node remotely");
    var outlineNodes = realtimeModel.outlineNodesAsArray();
    $('#' + outlineNodes[index].id).remove();
    realtimeModel.remove(index);
    reflowScreen();
    selectedItem--;
    selectItem();
  }

  var removeLocalNode = function(nodeid) {
    console.log("removing local!")
    
    console.log(nodeid)

    //var outlineNodes = realtimeModel.outlineNodesAsArray();
    $('#' + nodeid).remove();
    reflowScreen();
    selectItem();
  }

  var addRemoteNode = function(index) {
    console.log("adding remote!")
    var node = realtimeModel.addNode(index+1);
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
    selectedItem++;
    selectItem();
  }

  var addLocalNode = function(node) {
    console.log("adding local!")
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
    selectItem();
  }

  var updateLocalTitle = function(node) {
    console.log("updating local!")
    $("#" + node.id + " .title").text(node.title);
  }


  window.outlinerApp = {
    init: init,
    load: load,
    addLocalNode: addLocalNode,
    removeLocalNode: removeLocalNode,
    changeLocalNodeType: changeLocalNodeType,
    updateLocalTitle: updateLocalTitle,
    updateImageURL: updateImageURL,
    reflowScreenReordered: reflowScreenReordered,
    reflow: reflowScreen,
    refreshNode: refreshNode,
    scaleToFit: scaleToFit,
    twoplus: function() { return 2+2; }
  };



}).call(this);












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





