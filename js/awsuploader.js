;(function() {
  'use strict';

  var creds = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:9ec316d7-d2f7-4b6b-b544-ee508ed63915',
  });

  AWS.config.credentials = creds;
  AWS.config.region = 'us-east-1';

  var bucket = new AWS.S3({params: {Bucket: 'testbucket1234567234'}});

  var upload = function(file, nodeID) {
    var keyName = realtimeModel.getID() + "/" + guid() + "." + file.name.split(".")[file.name.split(".").length - 1]
    var params = {Key: keyName, ContentType: file.type, Body: file, ACL: 'public-read'};
    bucket.upload(params, function (err, data) {
      outlinerApp.updateImageURL(nodeID, data.Location);
    });  
  }

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  window.awsUploader = {
    upload: upload
  };
  
}).call(this);