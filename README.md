Outliner
============

<img align="right" style="padding-left: 30px; width: 100px;" src="https://raw.githubusercontent.com/setpixel/outliner/master/chromestore/icon_256.png">

Quickly outline the shit out of some stuff!

You can try the current version here: http://outliner.setpixel.com/

Basically, it's for sequencing story ideas as quickly as possible. When you write a story, you can add a bunch of nodes or scenes to quickly outline the idea. Then you can use that as a scaffold when you write the full story/screenplay/document.

```
ENTER: add a node
TAB: change node type
Arrow up and down: change selection
COMMAND+ Arrow: change order
```

I'm writing this in all vanilla JS, trying not to use any backend code.


I'm using Google Drive Realtime API, and AWS SDK.

===============

## Notes

**make sure to npm install and bower install inside the project folder**

### New Folder Structure

All project files now live in the assets folder.

assets
├── fonts
├── img
├── js
└── scss

### Using Gulp

    $ cd /path/to/outliner  
    $ gulp

gulpfile.js lives in /build and takes params from /config the initial gulpfile.js is in the root. 

*When running gulp a script tag gets added to the index.html for browser reloading, after shutting down gulp the script tag gets removed, be careful when you commits when gulp is running as you might commit the script inside of index.html*

### Adding a package with bower
    
    $ bower install --save-dev moment
    $ cp /bower_components/path/to/js /vendor

### Babel

/assets/js/main.js is the main file which imports all of the other .js files

When gulp is ran it will transpile es2015 to es5 and add it to /tmp called main.js

Any js library in /vendor will be concatenated and added to the /tmp folder called vendor.js

These two files are then concatenated and minified and put into public/assets/js/app.min.js

**LEARN ES6 and use it now**

### SCSS
Styles are now located in  /assets/scss/

main.scss is the base file which imports all other files. 

**look at the import structure as the files are now named and relocated**

*Gulp is using autoprefixer so you can remove any vendor prefixing*

### File Changes
**Removed css,data,js folders**

*Changed paths for imgs and fonts to new paths located in /public/assets/{fonts,imgs}*

Added a .gitignore since we dont need to commit some folders

### Google
You probably need to allow localhost:3000 as an allowed referrer if you plan on using the built in server


