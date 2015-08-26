/*

  TODAYS
    context menu shouldnt go offscreen
    scroll to position on selected item
    kochai: there's an issue when you keep deleting notes and you get to delete the last one on the top left, after that you can't go to another note to delete it until refreshing the page
    //scale to fit better!!!!
    filtering
      plural
      if 0
      no tags, no location, no characters?
      duration
      completion

    //filter by any index
    //right click context menu:
    //  add node after
    //  delete
    //  inspect
    //  speak from here
    //  zoom to fit
      
    //listen for image load for reflow
    show completion info
    //fix scrollbars
    figure out collaboration focus bug
    optimize reordering (dont set all dom css if not changed, index node locs and heights and widths)
    user set background
    //hook up type change
    //relayout inspector
    //auto on card
    //dump on window close
    //update stats
    //completion metadata
    //figure out safari bug
    //Save to google drive / import from google drive

  HIGHLEVEL
    MOBILE VIEW
    UNDO
    INSPECTOR
      story ideas
      //make look nice: 
      //  font sizes
      //  resize text areas
      //  awecomplete
      //  ui to close window
    FILTERING
      //add tags
      //ability to show nodes that have tags
      //tag coloring?
    UI
      fix overlap on small screens
    Printing
      output 
    VIEWS
      Presentation view
      Timeline view
    IMPORT/EXPORT
      fountain loader / fountain exporter
    COLLABORATORS
      location of selection
      location of cursor
      chat
    Speech playback
    script doctor

  TODAYS BUGS:
    make a mode to always scale to fit
    ability to deselect
    make it so scroll pos changes based on focus
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
    //stats display
    add printing capability
    //detail view for editing

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

import "./speech";
import "./contextmenu";
import "./awesomplete";
import "./outlinerutils";
import "./gamepad";
import "./chatwindow";
import "./inspectorwindow";
import "./toolbarui";
import "./scriptdoctor";
import "./stats";
import "./realtimeModel";
import "./awsuploader";
import "./circlebob";
import "./outlinerprint";
// import "./namesdb";

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

  var preventArrowToggle = false;

  var load = function(outlineNodes) {
    var htmlList = [];
    for (var i = 0; i < outlineNodes.length; i++) {
      htmlList.push(displayNodeHTML(outlineNodes.get(i)));
    };
    $("#canvas").append(htmlList.join(''));

    for (var i = 0; i < outlineNodes.length; i++) {
      attachEventListenersToNode(outlineNodes.get(i).id)
    }

    reflowScreen();
    setTimeout(reflowScreen, 200);
    setTimeout(reflowScreen, 600);
    
    selectedItem = 1;
    selectItem();

    changeScale(1);

    attachEventListenersToInspector();
  };

  var updateInspectorValues = function() {
    var nodes = realtimeModel.outlineNodesAsArray();
    var node = nodes[selectedItem];

    var fieldList = ['title', 'synopsis', 'imageURL','setting','timeOfDay','text', 'tags', 'actors', 'duration', 'completion'];

    for (var i = 0; i < fieldList.length; i++) {
      if (node[fieldList[i]] == "[]") { node[fieldList[i]] = ""; };
      $("#inspector #" + fieldList[i] ).val(node[fieldList[i]]);
    }

    $("#inspector #type" ).val(node['type'].capitalize());
  };

  var attachEventListenersToNode = function(nodeID) {
    setTimeout(function() {

      reflowScreen();

      setTimeout(reflowScreen, 100);


      $("#" + nodeID + " img").load(function(){
        console.log("image loaded!!!");
        reflowScreen();
      });

      $("#" + nodeID + " .title").on("input", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray();
        var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        node.title = $(event.target).text();
        updateInspectorValues();
      });
    
      $("#" + nodeID + " .synopsis").on("input", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray();
        var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        node.synopsis = $(event.target).text();
        updateInspectorValues();
      });

      $("#" + nodeID + " .setting").on("input change paste blur awesomplete-select", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray();
        if (event.target.parentElement.id === "") {
          var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.parentElement.parentElement.id })[0];
        } else {
          var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        }
        node.setting = $(event.target).text();
        updateInspectorValues();
      });

      if($("#" + nodeID + " .setting").length) {
        $("#" + nodeID + " .setting").data({a: new Awesomplete($("#" + nodeID + " .setting")[0], {
            list: $.map(realtimeModel.getIndex('setting').propertyList, function(value, index) { return value.toUpperCase() }),
            minChars: -1,
            maxItems: 15,
            autoFirst: true
          })
        }); 
      }
    
      $("#" + nodeID + " .time-of-day").on("input change paste blur awesomplete-select", function(event) {
        var nodes = realtimeModel.outlineNodesAsArray();
        if (event.target.parentElement.id === "") {
          var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.parentElement.parentElement.id })[0];
        } else {
          var node = $.grep(nodes, function(e){ return e.id == event.target.parentElement.id })[0];
        }
        node.timeOfDay = $(event.target).text();
        updateInspectorValues();
      });

      if($("#" + nodeID + " .time-of-day").length) {
        $("#" + nodeID + " .time-of-day").data({a: new Awesomplete($("#" + nodeID + " .time-of-day")[0], {
            list: $.map(realtimeModel.getIndex('timeOfDay').propertyList, function(value, index) { return value.toUpperCase() }),
            minChars: -1,
            maxItems: 15,
            autoFirst: true
          })
        });
      }

      $("#" + nodeID).dblclick(function(event) {
        inspectorWindow.toggle(true);
      });

      $("#" + nodeID).on("mousedown", function(event) {
        $('input').blur()

        selectItemByID(event.currentTarget.id)

        if (!$(event.target).attr("contenteditable")) {
          dragItem = $(event.currentTarget);
          dragTimeoutID = setTimeout(function() {
            if (dragItem) {
              dragItem.toggleClass( "dragged", true )
            }}, 100);

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

        var files = e.originalEvent.dataTransfer.files;
        if (files.length === 1) {
          var file = files[0];

          if ($.inArray(file.type, ['image/gif', 'image/jpg', 'image/jpeg', 'image/png']) != -1) {
              // upload it!
            awsUploader.upload(file, nodeID);
          }
        }
      });
    }, 200);
  };

  var attachEventListenersToInspector = function() {
    $("#inspector input, #inspector textarea").on("input change paste blur", function(event) {
      var nodes = realtimeModel.outlineNodesAsArray();
      var node = nodes[selectedItem];
      if ($(event.currentTarget).val() !== node[event.currentTarget.id]) {
        node[event.currentTarget.id] = $(event.currentTarget).val();
        updateLocalTitle(node);
        if (event.currentTarget.id == "synopsis") {
          updateLocalSynopsis(node); 
        }
        if (event.currentTarget.id == "setting") {
          updateLocalSetting(node);
        }
        if (event.currentTarget.id == "timeOfDay") {
          updateLocalTimeOfDay(node);
        }
      }
    });

    $("#inspector #type").on("change", function(event){
      var nodes = realtimeModel.outlineNodesAsArray();
      var node = nodes[selectedItem];
      if ($(event.currentTarget).val().toLowerCase() !== node[event.currentTarget.id]) {
        node[event.currentTarget.id] = $(event.currentTarget).val().toLowerCase();
        refreshNode(node.id);
        selectItem();
      }
    });

    $('#tags').data({a: new Awesomplete($("#tags")[0], {
        list: $.map(realtimeModel.getIndex('tags').propertyList, function(value, index) { return value.toLowerCase() }),
        minChars: -1,
        maxItems: 15,
        autoFirst: true,
        filter: function(text, input) {
          return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
        },
        replace: function(text) {
          var before = this.input.value.match(/^.+,\s*|/)[0];
          this.input.value = before + text + ", ";
        } 
      })
    });

    $('#setting').data({a: new Awesomplete($("#setting")[0], {
        list: $.map(realtimeModel.getIndex('setting').propertyList, function(value, index) { return value.toUpperCase() }),
        minChars: -1,
        maxItems: 15,
        autoFirst: true
      })
    });

    $('#timeOfDay').data({a: new Awesomplete($("#timeOfDay")[0], {
        list: $.map(realtimeModel.getIndex('timeOfDay').propertyList, function(value, index) { return value.toUpperCase() }),
        minChars: -1,
        maxItems: 15,
        autoFirst: true
      })
    });

    $('#actors').data({a: new Awesomplete($("#actors")[0], {
        list: $.map(realtimeModel.getIndex('actors').propertyList, function(value, index) { return value.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) }),
        minChars: -1,
        maxItems: 15,
        autoFirst: true,
        filter: function(text, input) {
          return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
        },
        replace: function(text) {
          var before = this.input.value.match(/^.+,\s*|/)[0];
          this.input.value = before + text + ", ";
        } 
      })
    });
  };

  var displayNodeHTML = function(obj) {
    var htmlList = [];
    switch (obj.type) {
      case "section":
        htmlList.push('<div class="section" id="' + obj.id + '"><div class="title" contenteditable="true" spellcheck="false">' + obj.title + '</div></div>');
        break;
      case "beat":
        htmlList.push('<div class="card beat" id="' + obj.id + '">');
        htmlList.push('<div class="label-container"></div>');
        if (obj.imageURL) {
          htmlList.push('<img src="' + obj.imageURL + '?123123" crossorigin="anonymous">');
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
        htmlList.push('<div class="label-container"></div>');
        if (obj.setting) {
          htmlList.push('<div class="go-left"><div class="setting" contenteditable="true" spellcheck="false">' + obj.setting + '</div></div>');
        } else {
          htmlList.push('<div class="go-left"><div class="setting hidden" contenteditable="true" spellcheck="false"></div></div>');
        }
        if (obj.timeOfDay) {
          htmlList.push('<div class="go-right"><div class="time-of-day" contenteditable="true" spellcheck="false">' + obj.timeOfDay + '</div></div>');
        } else {
          htmlList.push('<div class="go-right"><div class="time-of-day hidden" contenteditable="true" spellcheck="false"></div></div>');
        }
        htmlList.push('<div class="clear"></div>');
        if (obj.imageURL) {
          htmlList.push('<img src="' + obj.imageURL + '?123123" crossorigin="anonymous">');
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

  var verticalBreak = 45;

  var reflowScreen = function() {
    var yCursor = 0;
    var xCursor = 0;

    var nodes = realtimeModel.outlineNodesAsArray()

    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].type == "section" && i !== 0) {
        yCursor = 0;
        xCursor += 200+30;
      }

      if ((yCursor+$("#" + nodes[i].id).outerHeight()+20) > ((($( window ).height()-verticalBreak)/scale)-30)) {
        yCursor = 23;
        xCursor += 200+10;          
      }

      $("#" + nodes[i].id).css("top", yCursor);
      $("#" + nodes[i].id).css("left", xCursor);

      yCursor += $("#" + nodes[i].id).outerHeight() + 10;
      $("#" + nodes[i].id).css("visibility", "visible");
    }

    $('body').width((xCursor + 200+30)*scale+30);

    $("#right-padding-hack").css("left", xCursor + 200);

    return {lastXCursor: xCursor, lastWidth: 200+30};
  };


  var findOrderAt = function(x, y, _insertLocation) {
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

      if ((yCursor+$("#" + nodes[i].id).outerHeight()+20) > ((($( window ).height()-verticalBreak)/scale)-30)) {
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
      if ((yCursor+$("#" + nodes[i].id).outerHeight()+20) > ((($( window ).height()-verticalBreak)/scale)-30)) {
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



  var selectItemByID = function(id) {
    var nodes = realtimeModel.outlineNodesAsArray();
    var node = $.grep(nodes, function(e){ return e.id == id })[0];
    selectedItem = nodes.indexOf(node);
    selectItem();
  };

  var selectItem = function(forceTimeout) {
    var nodes = realtimeModel.outlineNodesAsArray();
    $("#canvas .selected").toggleClass("selected", false);
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
    updateInspectorValues();
  };

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
    var range = document.createRange();
    range.selectNodeContents(nextField[0])
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    nextField.focus();
    reflowScreen();
  };

  var deselectEverything = function() {
    var sel = window.getSelection();
    sel.removeAllRanges();
  };

  $('body').keydown(function(event) {
    if (document.activeElement.contentEditable === true || document.activeElement.nodeName === "INPUT" || document.activeElement.nodeName === "TEXTAREA") {
      
    } else {
      if (event.keyCode == 40 || event.keyCode == 27 || event.keyCode == 38 || event.keyCode == 13 || event.keyCode == 9 || (event.keyCode == 8 && (event.metaKey || event.ctrlKey)) || (event.keyCode == 187 && (event.metaKey || event.ctrlKey)) || (event.keyCode == 189 && (event.metaKey || event.ctrlKey)) || (event.keyCode == 89 && (event.metaKey || event.ctrlKey))) {
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
        if ((event.metaKey || event.ctrlKey)) {
          realtimeModel.move(selectedItem, selectedItem+2);
          selectedItem = selectedItem+1;
          reflowScreen();
        } else {
          if (!preventArrowToggle) {
            var length = realtimeModel.outlineNodesAsArray().length;
            selectedItem = Math.min(selectedItem+1, length-1);
            selectItem();
          }
        }

        break;
      case 27: 
        inspectorWindow.clearFilters();
        break;
      // up arrow  
      case 38:
        deselectEverything();
        if (event.metaKey || event.ctrlKey) {
          realtimeModel.move(selectedItem, selectedItem-1);
          selectedItem = selectedItem-1;
          reflowScreen();
        } else {
          if (!preventArrowToggle) {
            selectedItem = Math.max(selectedItem-1, 0);
            selectItem();
          }
        }
        break;
      // enter
      case 13:
        console.log(preventArrowToggle)
        if ((document.activeElement.nodeName == "INPUT") || (document.activeElement.nodeName == "TEXTAREA") || (document.activeElement.contentEditable == true) || (preventArrowToggle)) {
          //console.log("im on a input!")
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
        // console.log(JSON.stringify(nodes));
        break;
      case 82:
        reflowScreen();
        break;
      // backspace
      case 8:
        // the command key needs to be down
        if (event.metaKey || event.ctrlKey) {
          removeRemoteNode(selectedItem);
        }
        break;
      // 0 for fullscreen
      case 48:
        if (event.metaKey || event.ctrlKey) {
          toggleFullscreen();
        }
        break;
      case 187: 
        if (event.metaKey || event.ctrlKey) {
          changeScale(1);
        }
        break;
      case 189:
        if (event.metaKey || event.ctrlKey) {
          changeScale(-1);
        }
        break;
      case 73:
        if (event.metaKey || event.ctrlKey) {
          inspectorWindow.toggle();
        }
        break;
      case 90:
        // command z undo
        if (event.metaKey || event.ctrlKey) {
          realtimeModel.undo();
        }
        break;
      case 89:
        // command y redo
        if (event.metaKey || event.ctrlKey) {
          realtimeModel.redo();
        }
        break;
    }
  });

  var toggleFullscreen = function() {
    if (document.webkitIsFullScreen) {
      document.webkitExitFullscreen();
      setTimeout(scaleToFit, 1000);
    } else {
      document.documentElement.webkitRequestFullscreen();
      setTimeout(scaleToFit, 1000);
    }
  };

  var scaleToFit = function() {
    var screenWidth = $(window).width();
    scale = 0.1;
    var lastTestScale = 0;

    for (var i = 0; i < 200; i++) {
      scale += 0.025;
      var reflowValues = reflowScreen();
      //console.log(reflowValues)
      if ((screenWidth/scale) > (reflowValues.lastXCursor + reflowValues.lastWidth + 20)) {
        lastTestScale = scale; //Math.round10(scale, -1);
      } else {
        break;
      }
    }
    scale = lastTestScale;
    $("#canvas").css("transform", "translate3d(0,0,0) scale(" + lastTestScale + ")")
    reflowScreen();
  };

  $(document).on("selectstart", function(event) {
    if (dragItem) {
      return false;
    }
  });

  var scaleTo1 = function() {
    scale = 1.6;
    $("#canvas").css("transform", "translate3d(0,0,0) scale(" + scale + ")")
    reflowScreen();
  }

  var changeScale = function(amount) {
    var scaleIncrement;

    if (scale <= 0.9) {
      scaleIncrement = 0.1;
    } else if (scale > 0.9 && scale < 2) {
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
    scale = Math.round10(scale, -1);

    console.log(scale);

    $("#canvas").css("transform", "translate3d(0,0,0) scale(" + scale + ")")
    reflowScreen();
  }

  // document ready.
  $( function() {

    $(document).on("mousemove", function(event) {
      if (dragItem) {
        var scrollOffsetX = $("#canvas-container").scrollLeft();
        dragItem.toggleClass( "dragged", true )
        dragItem.css("top", ((event.pageY-20-dragOffset[1])/scale));
        dragItem.css("left", ((event.pageX-20-dragOffset[0]+scrollOffsetX)/scale));
        $(".title").blur();
        insertLocation = (findOrderAt(event.pageX+scrollOffsetX, event.pageY));
        insertLocation = (findOrderAt(event.pageX+scrollOffsetX, event.pageY, insertLocation));
        reflowScreenReordered(insertLocation);
        if (insertLocation !== tempInsert && insertPosition ) {
          circleBob.echo((insertPosition[0])*scale-scrollOffsetX,insertPosition[1]*scale)
        } else {
        }
        tempInsert = insertLocation;
      }
    });

    $(document).on("mousedown", function(event) {
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

    $("html").on("dragover", cancelEvents);
    $("html").on("dragleave", cancelEvents);
    $("html").on("drop", cancelEvents);
    $('#canvas-container').width($(window).width());
    $('#canvas-container').height($(window).height());
  });

  var cancelEvents = function(event) {
    event.preventDefault();  
    event.stopPropagation();
  };

  var updateImageURL = function(nodeID, imageURL) {
    var nodes = realtimeModel.outlineNodesAsArray();
    var node = $.grep(nodes, function(e){ return e.id == nodeID })[0];
    node.imageURL = imageURL;
    refreshNode(nodeID)
    //console.log("updating image url: " + imageURL)
  };

  var refreshNode = function(nodeID) {
    var nodes = realtimeModel.outlineNodesAsArray();
    var node = $.grep(nodes, function(e){ return e.id == nodeID })[0];
    $("#" + node.id).remove();
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
  };

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
  };

  var changeLocalNodeType = function(node) {
    $("#" + node.id).remove();
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
  };

  var removeRemoteNode = function(index) {
    var outlineNodes = realtimeModel.outlineNodesAsArray();
    $('#' + outlineNodes[index].id).remove();
    realtimeModel.remove(index);
    reflowScreen();
    selectedItem--;
    selectItem();
  };

  var removeLocalNode = function(nodeid) {
    $('#' + nodeid).remove();
    reflowScreen();
    selectItem();
  };

  var addRemoteNode = function(index) {
    console.log("adding remote!")
    var node = realtimeModel.addNode(index+1);
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
    selectedItem++;
    selectItem();
  };

  var addLocalNode = function(node) {
    $("#canvas").append(displayNodeHTML(node));
    attachEventListenersToNode(node.id);
    reflowScreen();
    selectItem();
  };

  var updateLocalTitle = function(node) {
    $("#" + node.id + " .title").text(node.title);
  };

  var updateLocalSynopsis = function(node) {
    if (node.synopsis !== "") {
      $("#" + node.id + " .synopsis").toggleClass("hidden", false);
      $("#" + node.id + " .synopsis").text(node.synopsis);
    }
  };

  var updateLocalSetting = function(node) {
    if (node.setting !== "") {
      $("#" + node.id + " .setting").toggleClass("hidden", false);
      $("#" + node.id + " .setting").text(node.setting);
    }
  };

  var updateLocalTimeOfDay = function(node) {
    if (node.timeOfDay !== "") {
      $("#" + node.id + " .time-of-day").toggleClass("hidden", false);
      $("#" + node.id + " .time-of-day").text(node.timeOfDay);
    }
  };

  var screenshot = function(callbackfunction) {
    var newDiv = $('<div style="opacity: 0.0; position: fixed;"></div>');
    var newDiv2 = $('<div style="left: 40px; position: relative; transform: translate3d(0px, 0px, 0px) scale(0.8);"></div>');
    newDiv.append(newDiv2.append($("#canvas-container").html()));
    $('body').prepend(newDiv);

    var canvasURL;

    html2canvas(newDiv, {
      onrendered: function(canvas) {
        canvasURL = canvas.toDataURL("image/jpeg", 0.5);
        newDiv.remove();
        callbackfunction(canvasURL);
      },
      width: 800,
      height: 600,
      async: false,
      removeContainer: true,
      background: "#0e76bc",
      allowTaint: false,
      useCORS: true
    });
  };

  var shareDialogue = function() {
    init = function() {
      var s = new gapi.drive.share.ShareClient('25911058412');
      s.setItemIds([ realtimeModel.getID() ]);
    }
    gapi.load('drive-share', init);
  };

  var filter = function(type, items) {
    // turn all nodes dark
    $('.card').toggleClass("dim", true);
    $('.label-container').empty();
    // get the ids for tags
    
    for (var z = 0; z < items.length; z++) {
      nodes = realtimeModel.getIndex(type).propertyElements[items[z]];
      // turn those nodes light
      for (var i = 0; i < nodes.length; i++) {
        $("#" + nodes[i]).toggleClass("dim", false);
        $("#" + nodes[i] + " .label-container").append('<div style="background-color: ' + tinycolor(outlinerUtils.stringToAscii(items[z])).desaturate(10).brighten(10).toHexString() + '; border-left: 3px solid ' + tinycolor(outlinerUtils.stringToAscii(items[z])).toHexString() + ';">' + items[z] + '</div>');
      }
    }
  };

  var clearFilter = function() {
    $('.card').toggleClass("dim", false);
    $('.label-container').empty();
  }

  var preventArrows = function() {
    preventArrowToggle = true;
    setTimeout(function(){ preventArrowToggle = true; }, 400);
  };

  var releaseArrows = function() {
    setTimeout(function(){ preventArrowToggle = false; }, 100);
  };

  var updateAutocomplete = function(property) {

    console.log("updatin auto: " + property )

    var updateList = function(property) {
      switch (property) {
        case 'setting':
          $('.' + property).each(function(i,v){
            if ($(v).data().a) {
              $(v).data().a.list = $.map(realtimeModel.getIndex(property).propertyList, function(value, index) { return value.toUpperCase() });
            }
          });
          break;
        case 'timeOfDay':
          //$('.' + property).data().a.list = $.map(realtimeModel.getIndex(property).propertyList, function(value, index) { return value.toUpperCase() });
          $('.' + property).each(function(i,v){
            if ($(v).data().a) {
              $(v).data().a.list = $.map(realtimeModel.getIndex(property).propertyList, function(value, index) { return value.toUpperCase() });
            }
          });
          break;
        case 'tags':
          //$('.' + property).data().a.list = $.map(realtimeModel.getIndex(property).propertyList, function(value, index) { return value.toLowerCase() });
          $('.' + property).each(function(i,v){
            if ($(v).data().a) {
              $(v).data().a.list = $.map(realtimeModel.getIndex(property).propertyList, function(value, index) { return value.toLowerCase() });
            }
          });
          break;
        case 'tags':
          //$('.' + property).data().a.list = $.map(realtimeModel.getIndex(property).propertyList, function(value, index) { return value.toLowerCase() });
          $('.' + property).each(function(i,v){
            if ($(v).data().a) {
              $(v).data().a.list = $.map(realtimeModel.getIndex(property).propertyList, function(value, index) { return value.toLowerCase() });
            }
          });
          break;
        default:
          //$('.' + property).data().a.list = $.map(realtimeModel.getIndex('actors').propertyList, function(value, index) { return value.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) });
          $('.' + property).each(function(i,v){
            if ($(v).data().a) {
              $(v).data().a.list = $.map(realtimeModel.getIndex('actors').propertyList, function(value, index) { return value.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) });            }
          });
      }
    }

    if ($('.' + property).data().a) {
      if (!preventArrowToggle) {
        updateList(property);
      } else {
        updateList(property);
      }
    }

    console.log("updatin auto end")

  };

  var addNode = function() {
    addRemoteNode(selectedItem);
  };

  var deleteNode = function() {
    removeRemoteNode(selectedItem);
  };

  window.outlinerApp = {
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
    scaleTo1: scaleTo1,
    screenshot: screenshot,
    shareDialogue: shareDialogue,
    filter: filter,
    clearFilter: clearFilter,
    preventArrows: preventArrows,
    releaseArrows: releaseArrows,
    changeScale: changeScale,
    selectItem: selectItem,
    addNode: addNode,
    deleteNode: deleteNode,
    setSelectedItem: function(item) { selectedItem = item; },
    toggleFullscreen: toggleFullscreen,
    updateAutocomplete: updateAutocomplete,
    getCurrentSelection: function() { return selectedItem; },
    twoplus: function() { return 2+2; }
  };

}).call(this);
