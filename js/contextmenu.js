;(function() {
  'use strict';

  var visible = false;

  var cmHeight = 0;

  var init = function() {
    var html = [];

    html.push("<div id='add'>Add node after</div>");
    html.push("<div id='delete'>Delete node</div>");
    html.push("<div id='inspect'>Inspect node</div>");
    html.push("<div id='speak'>Speak from here</div>");
    html.push("<hr/>");
    html.push("<div id='fit'>Zoom to fit</div>");
    html.push("<div id='fit-1'>Zoom 1:1</div>");

    $("#context-menu").html(html.join(''))
    
    setTimeout(addEventListeners, 500);

    setTimeout(function(){$("#context-menu").css("left", 10000);}, 200);
  };

  var addEventListeners = function() {
    $("#context-menu #add").on("click", function(){
      outlinerApp.addNode();
    })
    $("#context-menu #delete").on("click", function(){
      outlinerApp.deleteNode();
    })
    $("#context-menu #inspect").on("click", function(){
      inspectorWindow.toggle();
    })
    $("#context-menu #speak").on("click", function(){
      speech.speakFromNode(outlinerApp.getCurrentSelection());
    })
    $("#context-menu #fit").on("click", function(){
      outlinerApp.scaleToFit();
    })
    $("#context-menu #fit-1").on("click", function(){
      outlinerApp.scaleTo1();
    })
  };

  window.chatWindow = {
    twoplus: function() { return 2+2; }
  };

  $( function() {

    init();

    $(document).on("contextmenu", function(e){
      e.preventDefault();
      if (visible == false) {
        var maxY = $(window).height() - 215;
        $("#context-menu").css("left", e.pageX);
        $("#context-menu").css("top", Math.min(e.pageY, maxY));
        visible = true;
        $("#context-menu").toggleClass("hidden", false);
        $("#context-menu").show();
      } else {
        visible = false;
        $("#context-menu").toggleClass("hidden", true);
        setTimeout(function(){$("#context-menu").css("left", 10000);}, 200);
      }
    });

    $(document).on("click", function(e){
      if (visible && (e.button != 2)) {
        visible = false;
        $("#context-menu").toggleClass("hidden", true);
        setTimeout(function(){$("#context-menu").hide();}, 200);
        setTimeout(function(){$("#context-menu").css("left", 10000);;}, 200);
      }
    });

  });

}).call(this);