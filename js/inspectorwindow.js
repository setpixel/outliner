;(function() {
  'use strict';

  var visible; 

  var listenTimer;

  var toggle = function(forceOpen) {
    if (typeof forceOpen === 'undefined') {
      if (!visible) {
        visible = true;
        $("#inspector").toggleClass("hidden", false);
      } else {
        visible = false;
        $("#inspector").toggleClass("hidden", true);
      }
    } else {
      if (forceOpen) {
        visible = true;
        $("#inspector").toggleClass("hidden", false);
      } else {
        visible = false;
        $("#inspector").toggleClass("hidden", true);
      }
    }

    if (visible) {
      $("#stats").toggleClass("black", true);
    } else {
      $("#stats").toggleClass("black", false);
    }

    toolBarUI.reflow();
  };

  var reflow = function() {
    var windowHeight = $(window).height();

    var extraSpace = windowHeight-580;

    $("#inspector #synopsis").height(extraSpace*.35);
    $("#inspector #text").height(extraSpace*.65);

  };

  var renderFilters = function() {
    // view for completeness
    // view for length
    // 
    var filterTypes = [["tags", "Tags"],["setting", "Locations"],["actors", "Characters"]]

    for (var z = 0; z < filterTypes.length; z++) {
      // filterTypes[z][0]

      var html = [];

      if (realtimeModel.getIndex(filterTypes[z][0])) {
        var tags = realtimeModel.getIndex(filterTypes[z][0]);
        
        var pluralType = filterTypes[z][1];
        if (tags.propertyList.length == 1) {
          pluralType = filterTypes[z][1].slice(0,-1);
        }

        html.push("<h3>" + tags.propertyList.length + " " + pluralType + "</h3>");
        
        if (tags.propertyList.length == 0) {
          html.push('<span>Unfortunately, there are no ' + filterTypes[z][1].toLowerCase() + '. You should add some so you can filter your scenes and get automated story ideas and suggestions. You can add them easily by clicking inspector and adding tags, location, and characters to each scene.</span>');
        }

        for (var i = 0; i < tags.propertyList.length; i++) {
          html.push('<div class="filter-item" data-item="' + tags.propertyList[i] + '" data-type="' + filterTypes[z][0] + '" style="background-color: ' + tinycolor(outlinerUtils.stringToAscii(tags.propertyList[i])).desaturate(10).brighten(10).toHexString() + '; border-left: 6px solid ' + tinycolor(outlinerUtils.stringToAscii(tags.propertyList[i])).darken(10).toHexString() + ';">' + tags.propertyList[i] + '<div class="item-count">x ' + tags.propertyElements[tags.propertyList[i]].length + '</div></div>');
        }
        html.push('<br clear="all" />');
        $("#inspector .filter-" + filterTypes[z][0]).html(html.join(''));

      }

    }
    clearTimeout(listenTimer);
    listenTimer = setTimeout(attachListeners, 500)
  }

  var filterList = [];
  var filterType;

  var clearFilters = function() {
    filterList = [];
    $(".filter-item").toggleClass("selected", false);
    $('.card').toggleClass("dim", false);
    $('.label-container').empty();
  }

  var attachListeners = function() {
    // toggle item
    // if different main type, clear current filter list
    // add to current filter list
    clearFilters();

    $(".filter-item").on("click", function(event){
      if (filterType !== $(event.currentTarget).data('type')) {
        // reset other filters
        filterList = [];
        $(".filter-item").toggleClass("selected", false);
        filterType = $(event.currentTarget).data('type');
      }

      // toggle
      $(event.currentTarget).toggleClass("selected")

      if ($(event.currentTarget).hasClass("selected")) {
        filterList.push($(event.currentTarget).data('item'));
      } else {
        var index = filterList.indexOf($(event.currentTarget).data('item'));
        if (index != -1) {
          filterList.splice(index, 1);
        }
      }

      if (filterList.length > 0) {
        outlinerApp.filter(filterType, filterList);
      } else {
        outlinerApp.clearFilter();
      }

    })

    $(".filter-item").hover(function(event){
      outlinerApp.filter($(event.currentTarget).data('type'), [$(event.currentTarget).data('item')]);
    },function(event){
      if (filterList.length > 0) {
        outlinerApp.filter(filterType, filterList);
      } else {
        outlinerApp.clearFilter();
      }
    })

  }


  $(function() {

    $("#inspector .close-button").on("click", function(){
      toggle(false);
    });

    $("#inspector .tabs li").on("click", function(event){
      var id = event.target.id;
      var type = id.split("-")[0];
      $("#inspector .content").toggleClass("hidden", true);
      $("#inspector ." + type + "-content").toggleClass("hidden", false);
      $("#inspector .tabs li").toggleClass("select", false);
      $(event.target).toggleClass("select",true);  
    });

    $(window).resize(function(){
      reflow();
    });

    reflow();
  });


  window.inspectorWindow = {
    toggle: toggle,
    reflow: reflow,
    renderFilters: renderFilters,
    clearFilters: clearFilters,
    visible: function() { return visible; },
    twoplus: function() { return 2+2; }
  };

}).call(this);