/*

  HIGHLEVEL
    Inspector - hook up
    FILTERING - add tags, ability to show nodes that have tags
    UI
    Printing
    Save to google drive / import from google drive
    Presentation view
    COLLABORATORS

  TODAYS BUGS:
    //fiz scaling bug
    //make it so circle bob moves around appropriately
    //figure out the scroll offset for dragging!!!
    info view to edit node detail:
      type
      title
      synopsis
      imageURL
      setting
      timeOfDay
      text
      time (for timeline)
      tags [list]
      actors
      duration (of node)
      color
    //make it so you can edit any text (shift enter)
    //shift return to toggle between node fields
    //add padding to the right side of the dom
    show other collaborators mouse cursors
    //reflow after image loads
    //update the card after updating the image
    //reflow on window resize
  
  NEXT FEATURES:
    //button for auth
    //fullscreen
    //scale to fit the screen
    left and right arrows
    stats display
    add printing capability
    detail view for editing

  TODO:
    //make sure auth is a button initiated by a click event 
    MAKE NICER THOUGH

    //select node with cursor
    //drag and drop reordering
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
      //google realtime api
      joystick api -- reimplement
      
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
  var scale = 1.6;

  var selectedItem = 0;
  var insertLocation;

  var dragItem = null;
  var dragOffset;
  var dragTimeoutID;

  var tempInsert;
  var insertPosition;

  var init = function() {
    //console.log("Init!");
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
    setTimeout(reflowScreen, 200);
    //setTimeout(scaleToFit, 1000);
    
    selectedItem = 1;
    selectItem();


    changeScale(1);
  }

  var attachEventListenersToNode = function(nodeID) {
    setTimeout(function() {

      $("#" + nodeID + " .title").on("input", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray()
        var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        node.title = $(event.target).text()
      });
    
      $("#" + nodeID + " .synopsis").on("input", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray()
        var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        node.synopsis = $(event.target).text()
      });

      $("#" + nodeID + " .setting").on("input", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray()
        var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        node.setting = $(event.target).text()
      });
    
      $("#" + nodeID + " .time-of-day").on("input", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray()
        var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        node.timeOfDay = $(event.target).text()
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
          htmlList.push('<div class="synopsis" contenteditable="true" spellcheck="false">' + obj.synopsis + '</div>');
        } else {
          htmlList.push('<div class="synopsis hidden" contenteditable="true" spellcheck="false"></div>');
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
          htmlList.push('<div class="setting" contenteditable="true" spellcheck="false">' + obj.setting + '</div>');
        } else {
          htmlList.push('<div class="setting hidden" contenteditable="true" spellcheck="false"></div>');
        }
        if (obj.timeOfDay) {
          htmlList.push('<div class="time-of-day" contenteditable="true" spellcheck="false">' + obj.timeOfDay + '</div>');
        } else {
          htmlList.push('<div class="time-of-day hidden" contenteditable="true" spellcheck="false"></div>');
        }
        htmlList.push('<div class="clear"></div>');
        if (obj.imageURL) {
          htmlList.push('<img src="' + obj.imageURL + '">');
        }
        htmlList.push('<div class="title" contenteditable="true" spellcheck="false">' + obj.title + '</div>');
        if (obj.synopsis) {
          htmlList.push('<div class="synopsis" contenteditable="true" spellcheck="false">' + obj.synopsis + '</div>');
        } else {
          htmlList.push('<div class="synopsis hidden" contenteditable="true" spellcheck="false"></div>');
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

        if ((yCursor+$("#" + nodes[i].id).outerHeight()+20) > (($( window ).height()/scale)-20)) {
          yCursor = 23;
          xCursor += 200+10;          
        }

        $("#" + nodes[i].id).css("top", yCursor);
        $("#" + nodes[i].id).css("left", xCursor);

        yCursor += $("#" + nodes[i].id).outerHeight() + 10;
        $("#" + nodes[i].id).css("visibility", "visible");
      }

      // MAYBE TAKE THIS OUT?
      $('body').width((xCursor + 200+30)*scale+30);

      $("#right-padding-hack").css("left", xCursor + 200);

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

    var cNode = $("#" + nodes[selectedItem].id);
    circleBob.ping(cNode.position().left + ((cNode.width()+20)/2)-30+(30*scale), cNode.position().top + (cNode.height()/2)+20)


    if (nodes[selectedItem].title == "") {
      if ((Date.now()-Number(nodes[selectedItem].id)) < 1000 || forceTimeout) {
        setTimeout(function(){$("#" + nodes[selectedItem].id + " .title").focus();}, 100)
      } else {
        $("#" + nodes[selectedItem].id + " .title").focus();
      }
      
    } else {
      $(".title").blur();
    }
    
    stats.updateStats();
  }

  var goToNextField = function() {
    var fields;
    var nodes = realtimeModel.outlineNodesAsArray();

    switch (nodes[selectedItem].type) {
      case "section": 
        fields = ["title"];
        break;
      case "beat":
        fields = ["title", "synopsis"];
        break;
      case "scene":
        fields = ["title", "synopsis", "setting", "time-of-day"];
        break;
      case "note":
        fields = ["title"];
        break;
    }
    
    var currentField = fields.indexOf(document.activeElement.className);

    if ($("#" + nodes[selectedItem].id + " ." + fields[currentField] ).text() === "") {
      $("#" + nodes[selectedItem].id + " ." + fields[currentField] ).toggleClass("hidden", true)
    }

    var nextField = $("#" + nodes[selectedItem].id + " ." + fields[(currentField+1) % (fields.length)] )

    nextField.toggleClass("hidden", false)
    var length = nextField.text().length;
    // nextField[0].selectionStart = length;
    // nextField[0].selectionEnd = length;
    var range = document.createRange();
    range.selectNodeContents(nextField[0])
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    nextField.focus();
    reflowScreen();
  }

  var deselectEverything = function() {
    var sel = window.getSelection();
    sel.removeAllRanges();
  }


  $('body').keydown(function(event) {
    //console.log(document.activeElement.nodeName)

    if (document.activeElement.contentEditable === true || document.activeElement.nodeName === "INPUT" || document.activeElement.nodeName === "TEXTAREA") {
      
    } else {
      if (event.keyCode == 40 || event.keyCode == 38 || event.keyCode == 13 || event.keyCode == 9 || (event.keyCode == 8 && (e.metaKey || e.ctrlKey)) || (event.keyCode == 187 && (e.metaKey || e.ctrlKey)) || (event.keyCode == 189 && (e.metaKey || e.ctrlKey))) {
        event.preventDefault();
      }
      console.log(event)
    }

    var nodes = realtimeModel.outlineNodesAsArray()
      // TODO: ADD LEFT ARROW, RIGHT ARROW
      // down arrow
    switch (event.keyCode) {
      case 40: 
        deselectEverything();
        if ((e.metaKey || e.ctrlKey)) {
          realtimeModel.move(selectedItem, selectedItem+2);
          selectedItem = selectedItem+1;
          reflowScreen();
        } else {
          var length = realtimeModel.outlineNodesAsArray().length;
          selectedItem = Math.min(selectedItem+1, length-1);
          selectItem();
        }

        break;
      // up arrow  
      case 38:
        deselectEverything();
        if (e.metaKey || e.ctrlKey) {
          realtimeModel.move(selectedItem, selectedItem-1);
          selectedItem = selectedItem-1;
          reflowScreen();
        } else {
          selectedItem = Math.max(selectedItem-1, 0);
          selectItem();
        }
        break;
      // enter
      case 13:
        if ((document.activeElement.nodeName == "INPUT") || (document.activeElement.nodeName == "TEXTAREA")) {
          console.log("im on a input!")
        } else {
          if (event.shiftKey) {
            goToNextField();
          } else {
            addRemoteNode(selectedItem);
          }
        }


        break;
      // tab
      case 9:
        if ((document.activeElement.contentEditable != true) && (document.activeElement.nodeName != "INPUT") && (document.activeElement.nodeName != "TEXTAREA")) {
          toggleNodeType(selectedItem);
        }
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
        if (e.metaKey || e.ctrlKey) {
          removeRemoteNode(selectedItem);
        }
        break;
      // 0 for fullscreen
      case 48:
        if (e.metaKey || e.ctrlKey) {
          if (document.webkitIsFullScreen) {
            document.webkitExitFullscreen();
            setTimeout(scaleToFit, 1000);
          } else {
            document.documentElement.webkitRequestFullscreen();
            setTimeout(scaleToFit, 1000);
          }
          
        }
        break;
      case 187: 
        if (e.metaKey || e.ctrlKey) {
          changeScale(1);
        }
        break;
      case 189:
        if (e.metaKey || e.ctrlKey) {
          changeScale(-1);
        }
        break;
      case 73:
        if (e.metaKey || e.ctrlKey) {
          if ($("#inspector").hasClass("hidden")) {
            $("#inspector").toggleClass("hidden", false);
          } else {
            $("#inspector").toggleClass("hidden", true);
          }
        }
        break;
    }
  });

  var scaleToFit = function() {
    console.log("scale to fit")
    // this is super hacky, but it tot works!
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
      return lastFoundColumnItem;
    }
  };

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

      if ((yCursor+$("#" + nodes[i].id).outerHeight()+20) > (($( window ).height()/scale)-20)) {
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
      if ((yCursor+$("#" + nodes[i].id).outerHeight()+20) > (($( window ).height()/scale)-20)) {
        yCursor = 23;
        xCursor += 200+10;          
      }
      if (nodes[i].id === selectedID) {

        insertPosition = [xCursor + 120, yCursor + ($("#" + nodes[i].id).outerHeight()/2) + 20]

        yCursor += $("#" + nodes[i].id).outerHeight() + 10;
      } else {
        $("#" + nodes[i].id).css("top", yCursor);
        $("#" + nodes[i].id).css("left", xCursor);
        yCursor += $("#" + nodes[i].id).outerHeight() + 10;
      }
    }
  };

  var changeScale = function(amount) {
    var scaleIncrement;

    console.log(scale);

    if (scale <= 1) {
      scaleIncrement = 0.1;
    } else if (scale > 1 && scale < 2) {
      scaleIncrement = 0.2;
    } else {
      scaleIncrement = 0.4;
    }


    if (amount > 0) {
      scale += scaleIncrement;
    } else {
      scale -= scaleIncrement;
    }

    scale = Math.max(scale, 0.1);

    $("#canvas").css("transform", "translate3d(0,0,0) scale(" + scale + ")")
    reflowScreen();
  }

  // document ready yo.
  $( function() {

    $(document).on("mousemove", function(event) {
      if (dragItem) {
        var scrollOffsetX = $("#canvas-container").scrollLeft();
        dragItem.toggleClass( "dragged", true )
        dragItem.css("top", ((event.pageY-20-dragOffset[1])/scale));
        dragItem.css("left", ((event.pageX-20-dragOffset[0]+scrollOffsetX)/scale));
        $(".title").blur();
        insertLocation = (findOrderAt2(event.pageX+scrollOffsetX, event.pageY));

        insertLocation = (findOrderAt2(event.pageX+scrollOffsetX, event.pageY, insertLocation));

        reflowScreenReordered(insertLocation);

        if (insertLocation !== tempInsert && insertPosition ) {
          circleBob.echo((insertPosition[0])*scale-scrollOffsetX,insertPosition[1]*scale)
        } else {
          
        }
        tempInsert = insertLocation;

      }
    });

    $(document).on("mousedown", function(event) {
      //circleBob.flyTowards(event.clientX, event.clientY);
      circleBob.ping(event.clientX, event.clientY);
    });

    $(document).on("mouseup", function(event) {
      if (dragItem) {
        var scrollOffsetX = $("#canvas-container").scrollLeft();
        if ((selectedItem !== insertLocation) && insertLocation ) {
          // issue reorder to model
          if (selectedItem > insertLocation) {
            realtimeModel.move(selectedItem, insertLocation);
          } else {
            realtimeModel.move(selectedItem, insertLocation + 1);
          }
          selectedItem = insertLocation;
        }
        dragItem = null;
        $('.dragged').toggleClass( "dragged", false );
        reflowScreen();


        selectItem();

        insertLocation = null;
        //circleBob.ping((insertPosition[0])*scale-scrollOffsetX,insertPosition[1]*scale)

      }
    });

    $( window ).resize(function() {
      $('#canvas-container').width($(window).width());
      $('#canvas-container').height($(window).height());
      reflowScreen();
    });

    // $('#toolbar').on("mousemove", function(event) {
    //   scale = ((event.offsetX+30)/100)*2;
    //   $("#canvas").css("transform", "translate3d(0,0,0) scale(" + scale + ")")
    //   reflowScreen();
    // })

    $("html").on("dragover", cancelEvents);

    $("html").on("dragleave", cancelEvents);

    $("html").on("drop", cancelEvents);

    $('#canvas-container').width($(window).width());
    $('#canvas-container').height($(window).height());


  });

  var cancelEvents = function(event) {
    event.preventDefault();  
    event.stopPropagation();
  }

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
    var prevNode = $("#" + node.id);
    var tLoc = prevNode.position();
    circleBob.ping(tLoc.left + (prevNode.width()/2)+30, tLoc.top + (prevNode.height()/2)+40)

    prevNode.remove();
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
    var outlineNodes = realtimeModel.outlineNodesAsArray();
    $('#' + outlineNodes[index].id).remove();
    realtimeModel.remove(index);
    reflowScreen();
    selectedItem--;
    selectItem();
  }

  var removeLocalNode = function(nodeid) {
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
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
    selectItem();
  }

  var updateLocalTitle = function(node) {
    $("#" + node.id + " .title").text(node.title);
  }

  var updateLocalSynopsis = function(node) {
    $("#" + node.id + " .synopsis").toggleClass("hidden", false);
    $("#" + node.id + " .synopsis").text(node.synopsis);
  }

  var updateLocalSetting = function(node) {
    $("#" + node.id + " .setting").toggleClass("hidden", false);
    $("#" + node.id + " .setting").text(node.setting);
  }

  var updateLocalTimeOfDay = function(node) {
    $("#" + node.id + " .time-of-day").toggleClass("hidden", false);
    $("#" + node.id + " .time-of-day").text(node.timeOfDay);
  }

  window.outlinerApp = {
    init: init,
    load: load,
    addLocalNode: addLocalNode,
    removeLocalNode: removeLocalNode,
    changeLocalNodeType: changeLocalNodeType,
    updateLocalTitle: updateLocalTitle,
    updateLocalSynopsis: updateLocalSynopsis,
    updateLocalSetting: updateLocalSetting,
    updateLocalTimeOfDay: updateLocalTimeOfDay,
    updateImageURL: updateImageURL,
    reflowScreenReordered: reflowScreenReordered,
    reflow: reflowScreen,
    refreshNode: refreshNode,
    scaleToFit: scaleToFit,
    getCurrentSelection: function() { return selectedItem; },
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





