;(function() {
  'use strict';

  var toolbarHeight = 100;
  var toolbarActivated = true;
  var toolbarTimer;

  var reflow = function() {
    var toolBarWidth = $(window).width();
    if ($("#inspector").hasClass("hidden")) {
      $("#stats").css("right", 0);
    } else {
      toolBarWidth -= 450+40;
      $("#stats").css("right", 450+40);
    }

    var windowHeight = $(window).height();
    // remove some if inspector opened

    if (chatWindow.minimized()) {
      $("#chatwindow").css("left", toolBarWidth-300-250);
      $("#chatwindow").css("top", windowHeight-55);
      $("#toolbar .block.right").css("left", toolBarWidth-300-350-300);
    } else {
      $("#toolbar .block.right").css("left", toolBarWidth-300-350);
    }



    $("#toolbar .block.left").css("left", 180);
    

    
  };




  var activate = function() {
    toolbarActivated = true;
    clearTimeout(toolbarTimer);
    $('#toolbar').toggleClass("active", true);
  };

  var deactivate = function() {
    clearTimeout(toolbarTimer);
    toolbarActivated = false;
    $('#toolbar').toggleClass("active", false);
  }

  $( function() {

    $(window).on("mousemove", function(event){
      if (event.clientY > $(window).height()-toolbarHeight) {
        clearTimeout(toolbarTimer);
        if (!toolbarActivated) {
          activate();
        }
        
      } else {
        if (toolbarActivated) {
          toolbarActivated = false;
          toolbarTimer = setTimeout(deactivate, 1000);
        }
      }
    });

    $(window).resize(function(){
      reflow();
    })


    $("#toolbar-inspector").on("click", function() {
      outlinerApp.toggleInspector();
    });

    $("#toolbar-zoom-out").on("click", function() {
      outlinerApp.changeScale(-1);
    });

    $("#toolbar-zoom-in").on("click", function() {
      outlinerApp.changeScale(1);
    });

    $("#toolbar-fullscreen").on("click", function() {
      outlinerApp.toggleFullscreen();
    });

    toolbarTimer = setTimeout(deactivate, 1000);
    reflow();
  });



  window.toolBarUI = {
    reflow: reflow,
    twoplus: function() { return 2+2; }
  };



}).call(this);