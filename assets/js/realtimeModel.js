/* 

TODO
  make better error messages!!!!

*/

;(function() {
'use strict';

  var clientId = '25911058412-5cd4rmeie654agjb6j6s9nb05u8ao7h1.apps.googleusercontent.com';
  var realtimeUtils = new utils.RealtimeUtils({ clientId: clientId });

  var document;
  var docModel;
  var docRoot;

  var documentID;

  var tagList;
  var tagElements;

  var indices = {};

  authorize();

  function authorize() {
    outlinerUtils.browserCheck();

    realtimeUtils.authorize(function(response){
      if(response.error){
        $("#auth_window").toggleClass("hidden", false);
        $("#auth_button").on("click", function() {
          realtimeUtils.authorize(function(response){
            if (response.error) {

            } else {
              $("#auth_window").toggleClass("hidden", true);
              start();
            } 
          }, true);
        });
      } else {
        start();
      }
    }, false);
  };

  function start() {
    registerCustomTypes();

    var id;

    if (getUrlParameter('state')) {
      id = JSON.parse(getUrlParameter('state')).ids[0];
    } else {
      id = getUrlParameter('id');
    }

    if (id) {
      // Load the document id from the URL
      documentID = id.replace('/', '');
      realtimeUtils.load(id.replace('/', ''), onFileLoaded, onFileInitialize);
    } else {
      // Create a new document, add it to the URL
      window.gapi.client.load('drive', 'v2', function() {
        var insertHash = {
          'resource': {
            mimeType: 'application/vnd.google.drive.ext-type.otl',
            title: 'Untitled outline',
            parents: ['Outliner'], 
            labels: { restricted: true }
          }
        };
        window.gapi.client.drive.files.insert(insertHash).execute(function(createResponse) {
          //console.log(createResponse)
          window.history.replaceState(null, null, '?id=' + createResponse.id);
          realtimeUtils.load(createResponse.id, onFileLoaded, onFileInitialize);
          documentID = createResponse.id;
        });
      });
    }
  };

  function onFileInitialize(model) {
    if (documentID) {
      gapi.client.load('drive', 'v2', function(){
        var request = gapi.client.drive.files.get({
          'fileId': documentID,
          'alt': 'media'
        }).execute(function(e){
          if (!e.id) {
            createBasicNewDoc(model);
          } else {
            var request = gapi.client.request({
              'path': '/upload/drive/v2/files/' + documentID + '/realtime',
              'method': 'PUT',
              'params': {'uploadType': 'media'},
              'body': JSON.stringify(e.result)});
              request.execute();
          }
        });
      });
    } else {
      createBasicNewDoc(model);
    }
  };

  var createBasicNewDoc = function(model) {
    var documentMetadata = model.createMap();
    model.getRoot().set('documentMetadata', documentMetadata);
    documentMetadata.set('title', 'New Outline');
    documentMetadata.set('author', '');

    var viewData = model.createMap();
    model.getRoot().set('viewData', viewData);
    viewData.set('mode', 'default');
    viewData.set('scale', 2);

    var outlineNodes = model.createList();
    model.getRoot().set('outlineNodes', outlineNodes);

    var node = model.create('OutlineNode');
    node.title = 'This is a section';
    node.type = 'section';
    var index = outlineNodes.push(node);
    node.order = index;

    var node = model.create('OutlineNode');
    node.title = 'This is a beat!';
    node.type = 'beat';
    var index = outlineNodes.push(node);
    node.order = index;

    var node = model.create('OutlineNode');
    node.title = 'This is a scene.';
    node.type = 'scene';
    node.synopsis = 'This is a synopsis. You can add synopsis text by pressing command + return.';
    node.setting = 'INT. APARTMENT';
    node.timeOfDay = 'night';
    node.tags = 'apartment, fun, excitement';
    var index = outlineNodes.push(node);
    node.order = index;

    var node = model.create('OutlineNode');
    node.title = 'You can also have notes!';
    node.type = 'note';
    var index = outlineNodes.push(node);
    node.order = index;

    var node = model.create('OutlineNode');
    node.type = 'beat';
    node.title = 'You can add nodes by pressing return.';
    node.synopsis = 'You can also delete nodes by pressing command + backspace.';
    var index = outlineNodes.push(node);
    node.order = index;

    var node = model.create('OutlineNode');
    node.title = 'Drag an image file on me!';
    node.type = 'scene';
    node.synopsis = 'Try it out! Scenes and beats can have images.';
    node.tags = 'apartment, fun, excitement';
    var index = outlineNodes.push(node);
    node.order = index;
  }

  function displayObjectChangedEvent(evt) {
    console.log(evt);

    var events = evt.events;
    var eventCount = evt.events.length;

    for (var i = 0; i < eventCount; i++) {

      switch (events[i].type) {
        case "values_added": 
          for (var i2 = 0; i2 < events[i].values.length; i2++) {
            if (!events[i].isLocal || events[i].isUndo || events[i].isRedo){
              outlinerApp.addLocalNode(events[i].values[i2])
            }
            
          }
          break;
        case "values_removed": 
          for (var i2 = 0; i2 < events[i].values.length; i2++) {
            if (!events[i].isLocal || events[i].isUndo || events[i].isRedo){
              outlinerApp.removeLocalNode(events[i].values[i2].id)
            }
            
          }
          break;
        case "value_changed":

          if (events[i].target.id == outlineNodesAsArray()[outlinerApp.getCurrentSelection()].id) {
            $("#inspector #" + events[i].property).val(events[i].target[events[i].property])
          }

          switch (events[i].property) {
            case "type":
              if (!events[i].isLocal || events[i].isUndo || events[i].isRedo){
                outlinerApp.changeLocalNodeType(events[i].target);
              }
              break;
            case "title":
              if (!events[i].isLocal || events[i].isUndo || events[i].isRedo){
                outlinerApp.updateLocalTitle(events[i].target);
              }
              break;
            case "synopsis":
              if (!events[i].isLocal || events[i].isUndo || events[i].isRedo){
                outlinerApp.updateLocalSynopsis(events[i].target);
              }
              break;
            case "setting":
              if (!events[i].isLocal || events[i].isUndo || events[i].isRedo){
                outlinerApp.updateLocalSetting(events[i].target);
              }
              createIndex('setting', false);
              break;
            case "timeOfDay":
              if (!events[i].isLocal || events[i].isUndo || events[i].isRedo){
                outlinerApp.updateLocalTimeOfDay(events[i].target);
              }
              createIndex('timeOfDay', false);
              break;
            case "actors":
              createIndex('actors', true);
              break;
            case "tags":
              createIndex('tags', true);
              break;
            case "imageURL":
              if (!events[i].isLocal || events[i].isUndo || events[i].isRedo){
                outlinerApp.refreshNode(events[i].target.id);
              }
              break;
          }
          outlinerApp.reflow();
      }

      // save dump to google drive file!
      queueDump();

      // console.log('Event type: '  + events[i].type);
      // console.log('Local event: ' + events[i].isLocal);
      // console.log('User ID: '     + events[i].userId);
      // console.log('Session ID: '  + events[i].sessionId);
    }
  }

  var dumpTimeout;

  window.onbeforeunload = function() {
    if (dumpTimeout) {
      dumpToDrive();
      //return 'We are saving to drive... Please wait 10 seconds.';
    }
  };

  var queueDump = function() {
    clearTimeout(dumpTimeout);
    dumpTimeout = null;
    dumpTimeout = setTimeout(dumpToDrive, 20000);
  }

  function encodeURL(str){
      return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
  }


  var dumpToDrive = function() {
    clearTimeout(dumpTimeout);
    dumpTimeout = null;
    outlinerApp.screenshot(function(canvasURL){

      var jsonDoc = docModel.toJson();
      var thumbnailData = encodeURL(canvasURL.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""));
      var thumbnail = {image: thumbnailData, mimeType: "image/jpeg"}

      var fileMetadata = {mimeType: "application/vnd.google.drive.ext-type.otl", thumbnail: thumbnail};

      var boundary = '-------314159265358979323846';
      var delimiter = "\r\n--" + boundary + "\r\n";
      var close_delim = "\r\n--" + boundary + "--";

      var contentType = 'application/octet-stream';

      var base64Data = btoa(jsonDoc);

      var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(fileMetadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

      var request = gapi.client.request({
          'path': '/upload/drive/v2/files/' + documentID,
          'method': 'PUT',
          'params': {
            'uploadType': 'multipart', 'alt': 'json'},
          'headers': {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
          },
          'body': multipartRequestBody});
      request.execute(function(e){});



    })


  }

  var getUrlParameter = function getUrlParameter(sParam) {
      var sPageURL = decodeURIComponent(window.location.search.substring(1)),
          sURLVariables = sPageURL.split('&'),
          sParameterName,
          i;

      for (i = 0; i < sURLVariables.length; i++) {
          sParameterName = sURLVariables[i].split('=');

          if (sParameterName[0] === sParam) {
              return sParameterName[1] === undefined ? true : sParameterName[1];
          }
      }
  };


  function onFileLoaded(doc) {
    //console.log("ON FILE LOADED")

    document = doc;
    docModel = doc.getModel();
    docRoot = docModel.getRoot();

    var outlineNodes = docRoot.get('outlineNodes');

    docRoot.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, displayObjectChangedEvent);

    createIndex('tags', true);
    createIndex('actors', true);
    createIndex('setting', false);
    createIndex('timeOfDay', false);

    outlinerApp.load(outlineNodes);
    scriptDoctor.start();
    
    window.history.replaceState(null, null, '?id=' + documentID);
  }

  var createIndex = function(property, isList) {

    var propertyList = [];
    var propertyElements = {};

    var propertyMap = {};

    var nodes = outlineNodesAsArray();

    for (var i = 0; i < nodes.length; i++) {
      if (typeof nodes[i][property] === 'string') {
        if (nodes[i][property] == "[]") { nodes[i][property] = ""; };
        if (isList) {
          var propertyItems = nodes[i][property].split(",");
          for (var z = 0; z < propertyItems.length; z++) {
            var item = $.trim(propertyItems[z]);
            if (item !== "") {
              propertyMap[item.toLowerCase()] = ++propertyMap[item.toLowerCase()] || 1;
              if (propertyElements[item.toLowerCase()]) {
                propertyElements[item.toLowerCase()].push(nodes[i].id)
              } else {
                propertyElements[item.toLowerCase()] = [nodes[i].id]
              }
            }
          }
        } else {
          var item = nodes[i][property];
          if (item !== "") {
            propertyMap[item.toLowerCase()] = ++propertyMap[item.toLowerCase()] || 1;
            if (propertyElements[item.toLowerCase()]) {
              propertyElements[item.toLowerCase()].push(nodes[i].id)
            } else {
              propertyElements[item.toLowerCase()] = [nodes[i].id]
            }
          }
        }
      }
    }

    var propertyList = $.map(propertyMap, function(value, index){
      return [[index, value]];
    });

    propertyList.sort(function(a,b){
      if (a[1] < b[1]){
        return 1;
      } else if (a[1] > b[1]) {
        return -1;
      } else {
        return 0;
      }
    });
    
    propertyList = $.map(propertyList, function(value, index){
      return value[0];
    });

    indices[property] = {propertyList: propertyList, propertyElements: propertyElements};

    outlinerApp.updateAutocomplete(property);
    setTimeout(function(){stats.updateStats();}, 1000);
    //console.log("Created index for: " + property)
    // console.log(indices[property])

    //console.log(inspectorWindow.twoplus())

    inspectorWindow.renderFilters()

    return indices[property];
  };

  var OutlineNode = function(){};

  function registerCustomTypes() {

    function initializeOutlineNode() {
      var model = gapi.drive.realtime.custom.getModel(this);
      this.id = Date.now();
      this.beats = model.createList();
    }

    gapi.drive.realtime.custom.registerType(OutlineNode, 'OutlineNode');

    OutlineNode.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
    OutlineNode.prototype.order = gapi.drive.realtime.custom.collaborativeField('order');
    OutlineNode.prototype.type = gapi.drive.realtime.custom.collaborativeField('type');
    OutlineNode.prototype.title = gapi.drive.realtime.custom.collaborativeField('title');
    OutlineNode.prototype.synopsis = gapi.drive.realtime.custom.collaborativeField('synopsis');
    OutlineNode.prototype.imageURL = gapi.drive.realtime.custom.collaborativeField('imageURL');
    OutlineNode.prototype.setting = gapi.drive.realtime.custom.collaborativeField('setting');
    OutlineNode.prototype.timeOfDay = gapi.drive.realtime.custom.collaborativeField('timeOfDay');
    OutlineNode.prototype.text = gapi.drive.realtime.custom.collaborativeField('text');
    OutlineNode.prototype.time = gapi.drive.realtime.custom.collaborativeField('time');
    OutlineNode.prototype.tags = gapi.drive.realtime.custom.collaborativeField('tags');
    OutlineNode.prototype.actors = gapi.drive.realtime.custom.collaborativeField('actors');
    OutlineNode.prototype.beats = gapi.drive.realtime.custom.collaborativeField('beats');
    OutlineNode.prototype.duration = gapi.drive.realtime.custom.collaborativeField('duration');
    OutlineNode.prototype.completion = gapi.drive.realtime.custom.collaborativeField('completion');

    gapi.drive.realtime.custom.setInitializer(OutlineNode, initializeOutlineNode);
  };

  var addNode = function(index) {
    var outlineNodes = docRoot.get('outlineNodes');
    var node = docModel.create('OutlineNode');
    node.title = '';
    node.type = 'beat';
    outlineNodes.insert(index, node);
    return node;
  };

  var move = function(index, destIndex) {
    var outlineNodes = docRoot.get('outlineNodes');
    outlineNodes.move(index, destIndex);
  };

  var remove = function(index) {
    var outlineNodes = docRoot.get('outlineNodes');
    outlineNodes.remove(index);    
  };

  var outlineNodesAsArray = function() {
    if (docRoot) {
      return docRoot.get('outlineNodes').asArray();
    } else {
      return [];
    }
  };

  var undo = function() {
    var model = docModel;
    if (model.canUndo) {
      model.undo();
    }
  };

  var redo = function() {
    var model = docModel;
    if (model.canRedo) {
      model.redo();
    }
  };

  window.realtimeModel = {
    outlineNodesAsArray: outlineNodesAsArray,
    addNode: addNode,
    move: move,
    remove: remove,
    undo: undo,
    redo: redo,
    document: function(){ return document;},
    docModel: function(){ return docModel;},
    docRoot: function(){ return docRoot;},
    getID: function(){ return documentID; },
    getIndex: function(index) { return indices[index]; }
  };

}).call(this);