;(function() {
  'use strict';

  var lastScreenName = ""

  var dragged = false;
  var dragOffset;

  var minimized = false;

  var restoreLoc;

  var scrollToBottom = function(){
    var scrollHeight = $("#chatoutput")[0].scrollHeight;
    $("#chatoutput").scrollTop(scrollHeight);
  };

  var minimize = function() {
    minimized = true;
    restoreLoc = [$("#chatwindow").css("left"), $("#chatwindow").css("top")];
    $("#chatwindow").toggleClass("minimized", true);
    if ($("#inspector").hasClass("hidden")) {
      $("#chatwindow").css("left", $(window).width()-300-250);
    } else {
      $("#chatwindow").css("left", $(window).width()-300-250-490);
    }
    $("#chatwindow").css("top", $(window).height()-55);
    scrollToBottom();
    setTimeout(scrollToBottom, 1000);
    toolBarUI.reflow();
  }

  var restore = function() {
    minimized = false;
    $("#chatwindow").toggleClass("minimized", false);
    $("#chatwindow").css("left", restoreLoc[0]);
    $("#chatwindow").css("top", restoreLoc[1]);
    toolBarUI.reflow();
  }

  var addChatLine = function(screenname, text) {
    var html = [];

    if (lastScreenName == screenname) {
    } else {
      html.push( '<span class="screenname">' + screenname + ':</span>' );  
    }
    lastScreenName = screenname;
    html.push( '<span class="text">' + text + '</span>' );
    $("#chatoutput").append(html.join(''));

    scrollToBottom();
  };


  $( function() {

    var init = function() {
      $("#chatwindow").css("left", $(window).width()-$("#chatwindow").width()-60);
      $("#chatwindow").css("top", 20);
      minimize();
      setTimeout(function(){$("#chatwindow").css("opacity", '')}, 2000)
    }

    $("#chatwindow").css("opacity", 0);




    init();

    $("#chatinput").keydown(function(e){
      if (e.keyCode == 13) {
        addChatLine("charles", $('#chatinput').val());
        scriptDoctor.input($('#chatinput').val());
        $('#chatinput').val('');
      }
    })

    $("#chatwindow .minimizebutton").on("click", function(event){
      minimize();
    })

    $("#chatwindow").on("mousedown", function(event) {
      if (minimized) {
        restore();
      } else {
        dragged = true;
        dragOffset = [event.clientX - $("#chatwindow").offset().left, event.clientY - $("#chatwindow").offset().top]
      }
    });

    $(window).on("mouseup", function(event) {
      dragged = false;
      $("#chatwindow").toggleClass("dragged", false);
    });

    $(window).on("mousemove", function(event){
      if (dragged) {
        $("#chatwindow").toggleClass("dragged", true);
        $("#chatwindow").css("left", event.clientX - dragOffset[0]);
        $("#chatwindow").css("top", event.clientY - dragOffset[1]);
      }
    });

    $(window).resize(function() {
      var maxY = $(window).height() - 100;
      var maxX = $(window).width() - 100;
      $("#chatwindow").css("left", Math.min($("#chatwindow").position().left, maxX));
      $("#chatwindow").css("top", Math.min($("#chatwindow").position().top, maxY));
    });

  });

  window.chatWindow = {
    addChatLine: addChatLine,
    minimized: function() { return minimized },
    twoplus: function() { return 2+2; }
  };

  $( function() {
    scrollToBottom();
  });

}).call(this);