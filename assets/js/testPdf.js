// require dependencies
var PDFDocument = require('pdfkit');
var blobStream  = require('blob-stream');

// create a document the same way as above
var doc = new PDFDocument();

console.log(doc);
// pipe the document to a blob
var stream = doc.pipe(blobStream());

// add your content to the document here, as usual

// get a blob when you're done
doc.end();
stream.on('finish', function() {
  // get a blob you can do whatever you like with
  var blob = stream.toBlob('application/pdf');

  // or get a blob URL for display in the browser
  var url = stream.toBlobURL('application/pdf');
  iframe.src = url;
});

