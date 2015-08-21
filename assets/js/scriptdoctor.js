/*
  TODAYS
    respond to commands
    creative prompts
      name gen
      story idea
      scene idea
      prompts
    better idle tree
    tour
    engage with questions
    positive affirmation function


  random name
  predictably random
  only run on one computer
  tour
  its been a while! WHERE HAVE YOU BEEN?
  operates in a mode
    will go out of mode on idle or after run its course
  randomly prompt
    did you know?
    story questions
      character
        traits
        relationships
        where they are introduced
        backstory?
        what would they say?
        gender change
      tone

      theme
        whats the theme of the story?
      plot
        what is the but that happens after scenex
        timing of scenes
        could a character be in this scene instead of?
        what if an event happened here?
      prompting for tags
        could there be a "love" scene between here and here?
        do we have too many "xxx" scenes?
    location ideas
    scene ideas
    name ideas

  personality
    his credentials
    trying to sell you his book
    he lives with his mom
    do you think we can be cowriters on this?
    positive reinforcement

  respond to responses
    questions
    affirmative
    negative
    statement
    fake delay
  can do commands
  respond to summon
  respond to go away

*/


;(function() {
  'use strict';

  var clientName;

  var doctorName = "Max";

  var outputQueue = [];

  var outputTimer;

  var awaitTimer;
  var awaitResponse;

  var mode = 'idle';

  var idleTimeout = 30 * 60 * 1000;
  var idleTimer;


  var start = function() {
    // new?
    // second time?
    // returning
    // been a while

    var colls = realtimeModel.document().getCollaborators();
    for (var i = 0; i < colls.length; i++) {
      if (colls[i].isMe) {
        clientName = colls[i].displayName.split(" ")[0];
      }
    }


    greeting();

  };


  var greeting = function() {
    var greetingStrings = ["hi there", "hi " + clientName + "!", clientName + "!"];
    queOutput(greetingStrings[Math.floor((Math.random()*greetingStrings.length))]);
    var greetingQuestion = ["how's it going?", "how have you been?", "how are you?!?"];
    var response = {positive: ["that's great!", "good to hear", "yay!", ":)", "sounds even better than my sitch."], negative: [["i'm sorry to hear about that", "i really am"], ["there will be brighter days!","especially for you!"]]};
    var noResponse = ["oh. i guess you're busy", ":(", "sorry to bother you. I was just curious", "I thought we were friends, " + clientName, "ok dude. well I'll be right here if you need me", "..."];
    queQuestion(greetingQuestion.randomElement(), response, noResponse.randomElement(), 20000);
    introduction();
    // history
    // whats been going on with him
    // can you buy my book?


    // positive reinforcement


  };

  var introduction = function() {
    var script = [
    "i'm Max, a script doctor!",
    "like most script doctors, i'm not a real doctor",
    "i'm like dr. pepper",
    "or dr. dre",
    "but slightly more important",
    "do you realize that i've written 4 scripts and done coverage for all the major studios?",
    "i'm a pretty big deal.",
    "anyways..",
    "normally i charge $400 an hour for my services",
    "but today i do for free",
    "i'm here to help",
    "feel free to ask me stuff"];

    queOutput(script);

  };

  var queOutput = function(outputVal, delay) {
    mode = 'queued';
    if (!delay) { delay = 0; }
    if (Array.isArray(outputVal)){
      for (var i = 0; i < outputVal.length; i++) {
        if (i > 0) { delay = 0; }
        if (outputVal[i] !== "") {
          outputQueue.push({type: "statement", string: outputVal[i], delay: delay});
        }
      }
    } else {
      if (outputVal !== "") {
        outputQueue.push({type: "statement", string: outputVal, delay: delay});
      }
    }
    checkOutput();

    clearTimeout(idleTimer);
    idleTimer = setTimeout(function(){returnFromIdle(); }, idleTimeout);

  };

  var quePriorityOutput = function(string, delay) {
    mode = 'queued';
    if (!delay) { delay = 0; }
    outputQueue.unshift({type: "statement", string: string, delay: delay});
    checkOutput();
  };

  var queQuestion = function(string, response, noResponse, waitTime, delay) {
    if (!delay) { delay = 0; }
    outputQueue.push({type: "question", string: string, response: response, noResponse: noResponse, waitTime: waitTime, delay: delay});
    checkOutput();
  };

  var checkOutput = function() {
    if (outputTimer) {
    } else {
      if (outputQueue.length > 0) {
        clearTimeout(idleTimer);
        var t = outputQueue.shift();

        if (t.type == "question") {
          mode = 'watingresponse';
          awaitResponse = {response: t.response, noResponse: t.noResponse};
          awaitTimer = setTimeout(function() {noResponse(); }, t.waitTime);
        } else {
          mode = 'queued';

        }

        var naturalDelay = 700 + (t.string.length * 20) + t.delay;
        outputTimer = setTimeout(function() {output(t.string); }, naturalDelay);

      } else {
        mode = 'idle';
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function(){returnFromIdle(); }, idleTimeout);
      }
    }
  };

  var returnFromIdle = function() {
    idleTimer = null;
    queOutput("Can I ask you a question?");
    queQuestion("Do you like cats?", {positive: ["what!?!? i hate cats", "well.. you're wrong"], negative: "me too"}, ["I'm just saying.. cats r weird yo", "whats to like about them?"], 20000);
    queOutput("I'll never know why people like cats");
  };

  var noResponse = function() {
    // should he accumulate idle points? more ignored means more absent
    awaitTimer = null;
    mode = 'idle';
    clearQueue();
    idleTimeout += 1 * 60 * 1000;
    if (Array.isArray(awaitResponse.noResponse)) {
      for (var i = 0; i < awaitResponse.noResponse.length; i++) {
        quePriorityOutput(awaitResponse.noResponse[i]);
      }
    } else {
      quePriorityOutput(awaitResponse.noResponse);
    }
  };

  var output = function(string) {
    outputTimer = null;
    // write to chat
    //console.log("scriptDoctor: " + string);

    chatWindow.addChatLine("Script Dr. " + doctorName, string);


    // chat should not speak!!

    // if (string.slice(-1) == "?") {
    //   speech.speakText(string.replace(/<(?:.|\n)*?>/gm, '') + "? ");
    // } else if (string.slice(-2) == "...") {
    //   speech.speakText(string.replace(/<(?:.|\n)*?>/gm, '').replace("...", ".") + " ");
    // } else if (string.slice(-1) == ".") {
    //   speech.speakText(string.replace(/<(?:.|\n)*?>/gm, '') + " ");
    // } else if (string.slice(-1) == "!") {
    //   speech.speakText(string.replace(/<(?:.|\n)*?>/gm, '') + " ");
    // } else {
    //   speech.speakText(string.replace(/<(?:.|\n)*?>/gm, '') + ". ");
    // }

    if (!awaitTimer) {
      checkOutput();
    }

  };

  var clearQueue = function() {
    clearTimeout(outputTimer);
    outputTimer = null;
    outputQueue = [];
  };

  var input = function(string) {
    string = string.toLowerCase();

    clearTimeout(idleTimer);
    idleTimer = setTimeout(function(){returnFromIdle(); }, idleTimeout);


    var type = responseType(string);

    if (type == "statement") {
      type = (statementType(string));
    } else if (type == "question") {
      type = (questionType(string));
    } else {

    }

    console.log(type);

    if (mode == "idle") {
      idleRespond(type, string);

    } else if (mode == "watingresponse") {
      clearTimeout(awaitTimer);
      awaitTimer = null;
      var answer;
      if (type.indexOf("question") != -1) {
        clearQueue();
        queOutput([["dude!","don't you know", "you're not supposed to answer a question", "with a question?", "anyways..."],["ok.."],["alright"]].randomElement());
        idleRespond(type, string);
        return;
      } else if (type == "negative") {
        if (awaitResponse.response.negative) {
          if (Array.isArray(awaitResponse.response.negative)) {
            answer = awaitResponse.response.negative.randomElement();
          } else {
            answer = awaitResponse.response.negative;
          }
        } else {
          if (Array.isArray(awaitResponse.response)) {
            answer = awaitResponse.response.randomElement();
          } else {
            answer = awaitResponse.response;
          }
        }
      } else {
        if (typeof awaitResponse.response.positive == 'function') {
          awaitResponse.response.positive();
          return;
        } else {
          if (awaitResponse.response.positive) {
            if (Array.isArray(awaitResponse.response.positive)) {
              answer = awaitResponse.response.positive.randomElement();
            } else {
              answer = awaitResponse.response.positive;
            }
          } else {
            if (Array.isArray(awaitResponse.response)) {
              answer = awaitResponse.response.randomElement();
            } else {
              answer = awaitResponse.response;
            }
          }
        }
      }

      if (Array.isArray(answer)) {
        for (var i = 0; i < answer.length; i++) {
          //Priority?
          quePriorityOutput(answer[i]);
        }
      } else {
        quePriorityOutput(answer);
      }

    } else {
      clearQueue();
      idleRespond(type, string);
    }


  };

  var specificQuestions = [
    ["how old are you", ["27",["old enough to be mad successful as one of the most sought after script doctors!"]]],
    ["whats your name", [["Script Dr. " + doctorName,"whats yours?","oh I already knew that", "you're " + clientName + "!"],["Max!", "but you can call me anytime"]]],
    ["what's your name", [["Script Dr. " + doctorName,"whats yours?","oh I already knew that", "you're " + clientName + "!"],["Max!", "but you can call me anytime"]]],
    ["what is your name", [["Script Dr. " + doctorName,"whats yours?","oh I already knew that", "you're " + clientName + "!"],["Max!", "but you can call me anytime"]]],
    ["what do you do", [["I'm here to help", "once you outline a little more","i can make some story suggestions","make sure you add tags","characters", "settings","etc!","i can be helpful!","you'll see!"]]],
    ["how did you know my name", "it's through google drive. no one else can see your name except people you share your google drive document with."],
    ["how do you know my name", "it's through google drive. no one else can see your name except people you share your google drive document with."],
    ["where do you live", [["i live in the computer", "in my mom's basement.", "you know, because my mansion isn't done being rennovated yet."]]],
    ["are you a robot", [["YES","wait.","why did it type that automatically?","where is my body?"]]],
    ["are you a bot", [["YES","wait.","why did it type that automatically?","where is my body?"]]],
    ["are you real", [["define real.","im not a real person", "but I am real cool"]]],
    ["who are you", "I'm script doctor!"],
    ["how are you", ["I'm pretty good.","I can't complain","im always feeling pretty good!"]],
    ["who built this", [["Charles Forman","you can see email him at: setpixelphone@gmail.com"]]],
    ["who built you", [["Charles Forman","you can see email him at: setpixelphone@gmail.com"]]],
    ["what do you know", [["not a whole lot","im just a script doctor", "livin in my mom's basement", "in a computer"], "not much :(", ["if you need help..", "please email charles","at setpixelphone@gmail.com"]]],
    ["what do you eat", [["electricity!","but not much", "i'm trying to cut down"], "i'm hungry", ["why?", "do I look fat?"]]],
  ];

  var tellJoke = function() {
    var joke = [
      ["If you want to know who is really man’s best friend,", "put your dog and your wife in the trunk of your car,","come back an hour later,","open the trunk,","and see which one is happy to see you.","see not very funny."],
      ["What happens to a frog's car when it breaks down?","It gets toad away."],
      ["Yo mamma is so ugly when she tried to join an ugly contest they said,","Sorry, no professionals."],
      ["What did the duck say when he bought lipstick?","Put it on my bill."],
      ["Did you hear about the guy whose whole left side was cut off?","He's all right now."],
    ].randomElement();
    queOutput(joke);
  };

  var tellHelp = function() {
    var help = [
      clientName + "! All you had to do is ask.",
      "What kind of help do you want?",
      "Do you want a <strong>tour</strong>?",
      "Do you want a story <strong>ideas</strong>?",
      "Do you want some <strong>tips</strong>?",
      "I can ask you questions and make suggestions about your story.",
      "It might give you some ideas!",
     ];
    queOutput(help);
  };

  var tellTour = function() {
    var help = [
      "This is an outlining tool called <strong>Outliner</strong>.",
      "It's a tool to allow you to quickly sequence story ideas and organize them well.",
      "At the most basic level, outlining is all about creating and moving around nodes",
      "just like you would outline a story with index cards and put them on the wall.",
      "BTW - Outliner is collaborative! So you can share your document with a friend on Google Drive.",
      "There are 4 kinds of nodes:",
      "<strong>Sections</strong>",
      "You can think of these like 'ACT 1' or even more granular like 'ACTION SEQUENCE'",
      "<strong>Beats</strong>",
      "These are basic story beats. You can be as broad or specific as you like!",
      "<strong>Scenes</strong>",
      "This is where the real story happens. You can write a scene title, synopsis, setting, etc.",
      "You can also add the characters who are in the scenes, and tags for filtering!",
      "<strong>Notes</strong>",
      "Notes are simply notes. Put them wherever you'd like!",
      "Let's see what else...",
     ];
    queOutput(help);
    queOutput("I want to tell you about keyboard commands...");
    queQuestion("Are you ready?", {positive: tellTour2, negative: ["ok. you can ask me again anytime."]}, "ok. you can ask me again anytime.", 60000);
  };

  var tellTour2 = function() {
    var help = [
      "Outliner is designed to use <strong>key commands</strong>.",
      "The idea is to keep your hands mostly on the keyboard.",
      "As quickly as you have an idea, just start typing!",
      "<strong>Navigate using ARROW KEYS</strong>",
      "Move the around with the up and down arrows!",
      "<strong>Create a new node: RETURN</strong>",
      "Create a beat and start typing your title!",
      "<strong>Change a node: TAB</strong>",
      "Press tab a bunch of times to toggle through node types.",
      "<strong>Write a synopsis: SHIFT + ENTER</strong>",
      "Press shift + enter while on a node to add more description.",
      "<strong>To reorder: COMMAND + ARROW KEYS</strong>",
      "Hold command and press up and down to quickly reorder nodes. It's fast and easy.",
      "<strong>Open node inspector: COMMAND + i</strong>",
      "The inspector allows you to add a bunch more metadata to a node.",
     ];
    queOutput(help);
    queOutput("There are a few more keyboard commands...");
    queQuestion("Ready to hear more?", {positive: tellTour3, negative: ["ok. you can ask me again anytime."]}, "ok. you can ask me again anytime.", 60000);
  };

  var tellTour3 = function() {
    var help = [
      "<strong>Zoom in: COMMAND + +</strong>",
      "Zoom in to see nodes more clearly",
      "<strong>Zoom out: COMMAND + -</strong>",
      "Zoom out to see the full picture.",
      "<strong>Go fullscreen: COMMAND + 0</strong>",
      "When you go full screen it will automatically scale your outline to fit the screen.",
      "This is great for presenting.",
     ];
    queOutput(help);
    queOutput("I want to tell you about filtering!!!");
    queQuestion("Ready to hear more?", {positive: tellTour4, negative: ["ok. you can ask me again anytime."]}, "ok. you can ask me again anytime.", 60000);
  };

  var tellTour4 = function() {
    var help = [
      "When you are in the <strong>Node Inspector (COMMAND + i)</strong>,",
      "You can add:",
      "<strong>SETTING</strong>",
      "<strong>TAGS</strong>",
      "<strong>CHARACTERS</strong>",
      "To your beats and scenes.",
      "This is nice because you can then filter by setting, tag, or character.",
      "So you can see all the <strong>Action Scenes</strong>",
      "Or scenes with a <strong>particular character</strong>",
      "Or scenes with a <strong>specific location</strong>",
     ];
    queOutput(help);
    queOutput("There are some things coming soon...");
    queQuestion("Ready to hear more?", {positive: tellTour5, negative: ["ok. you can ask me again anytime."]}, "ok. you can ask me again anytime.", 60000);
  };

  var tellTour5 = function() {
    var help = [
      "<strong>COMING SOON</strong>",
      "There are a bunch of features coming soon...",
      "<strong>Timeline View</strong>",
      "<strong>Edit/Duration View</strong>",
      "<strong>Presentation View</strong>",
      "And...",
      "<strong>Importing and Exporting Fountain scripts</strong>",
      "<strong>Printing and PDF generation</strong>",
      "<strong>Better Script Dr. Logic</strong>",
      "And more!",
     ];
    queOutput(help);
    queOutput("Whoa. That was a lot.");
    queOutput("Feel free to scroll up.");
    queQuestion("Did I answer all your questions?", {positive: "Great!", negative: [["I'm sorry", "Feel free to email Charles Forman, the creator:", "at setpixelphone@gmail.com"]]}, ["I'm sorry", "Feel free to email Charles Forman, the creator:", "at setpixelphone@gmail.com"], 60000);
  };



  var idleRespond = function(type, string){
    var response;
    var delay;
    switch (type) {
      case "help":
        tellHelp();
        break;
      case "joke":
        tellJoke();
        break;
      case "tour":
        tellTour();
        break;
      case "read":
        speech.speakFromNode();
        break;
      case "continue":
        speech.speakFromNode(outlinerApp.getCurrentSelection());
        break;
      case "stop":
        speech.stop();
        queOutput("Alright.");
        break;
      case "specificquestion":
        for (var i = 0; i < specificQuestions.length; i++) {
          if (specificQuestions[i][0] === string.split("?").join('')){
            if (Array.isArray(specificQuestions[i][1])){
              var answer = specificQuestions[i][1].randomElement();

              queOutput(answer);

            } else {
              queOutput(specificQuestions[i][1]);
            }
            response = specificQuestions[i][1];
          }
        }

        //if (response) { queOutput(response, delay) };
        break;
      case "laugh":
        var responses = [
          ["lolz"],
          ["i know!", "funny right?"],
          ["haha"],
          [":)"],
          ["tee hee"]
        ];
        response = responses.randomElement();
        if (response) { queOutput(response, delay); }
        queQuestion(["wanna hear a joke?", "wanna hear something funny?"].randomElement(), {positive: tellJoke, negative: ["fine. be that way", "ok. then you tell me one."]}, ["it's ok. i't not funny anyways.", "oh well. it was a good one.", ":("].randomElement(), 20000);
        break;
      case "greeting":
        response = [
          ["hey dude!"],
          ["sup!!!"],
          ["what's going on?"],
          ["hey bud", "glad we're friends"],
          ["long time no see!"],
          ["yooooo"],
          ["hi!"],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        break;
      case "greetingquestion":
        response = [
          ["i'm awake!", "i'm right here!"],
          ["i'm right here", "don't worry about anything!"],
          ["yo!", "how can I help you?"],
          ["hello", "hello", "hello", "it's an echo!"],
          ["i was just in the bathroom.", "don't go in there"],
          ["hello!"],
          ["hi!"],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        queQuestion(["what are we working on right now?","what are you doing?","are you working on something cool right now?"].randomElement(), ["sounds great", "let me know how I can help", "awesome!"].randomElement(), ["ok.. i can see you're busy", "... that's exciting.", "oh well. I can see anyways."].randomElement(), 20000);
        break;
      case "qualityquestion":
        delay = 2000;
        response = [
          ["hmm...", "thats a good question"],
          ["let me think about that..."],
          ["hmm......"],
          ["I don't know..."],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        response = [
          ["i'm afraid I don't know"],
          ["i definately don't know that one."],
          ["i'm confused.","i don't know."],
          ["no idea.."],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        queOutput(["what do you think?",""].randomElement());
        queQuestion(string, {positive: ["sounds great", "let me know how I can help", "awesome!"], negative: ["me neither", "yeah.. i dont know"]}, ["ok.. i can see you're busy", "... that's exciting.", ["oh well. I'll find out.", "someday"]].randomElement(), 20000);
        break;
      case "confusionquestion":
        response = [
          ["i don't know!","you seem confused","can I help you?"],
          ["if you need help", "just ask for it!"],
          ["i'm here to help!"],
          ["ask me all your questions", "I'm pretty dumb", "but I'll do my best!"],
          ["I don't know all the answers", "but i will try"],
          ["????","can you ask me in a different way?"],
          ["if you still have questions", "you can email Charles the creator of this", "at setpixelphone@gmail.com"],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        break;
      case "thanks":
        response = [
          ["no,","thank you!"],
          ["you're welcome"],
          ["no problem!"],
          ["hey", "thank you", "for being a friend."],
          ["it's my pleasure"]
        ].randomElement();
        if (response) { queOutput(response, delay); }
        break;
      case "affirmative":
        response = [
          [":D"],
          [":)"],
          ["awesome!"],
          ["you know it."],
          ["always", "for you", "forever."],
          ["great!","you know you're my favorite","right?","I'm for real","not in a creepy way","ok","i'll shut up now."],
          ["yes!"]
        ].randomElement();
        if (response) { queOutput(response, delay); }
        break;
      case "negative":
        response = [
          [":("],
          ["what's wrong buddy?","anything I can help with?"],
          [":/"],
          ["don't be negative", "be positive!"],
          ["don't worry"],
          ["(╯°□°）╯︵ ┻━┻", "im flippin tables!"],
          ["¯\_(ツ)_/¯"],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        break;
      case "positive":
        response = [
          [":D"],
          ["O_O", "<3", "^_^"],
          [":)"],
          ["<3"],
          [":-)"],
          [";)"],
          ["--------{---(@"],
          ["d(^o^)b¸¸♬·¯·♩¸¸♪·¯·♫¸¸"],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        break;
      case "sorry":
        response = [
          ["apology accepted!"],
          ["i'm sorry!"],
          ["if anyone should be sorry","it should be me"],
          ["no problem"],
          ["no!", "i'm sorry!"],
          ["I'm glad we're friends again!"],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        break;
      case "swear":
        response = [
          ["oh no","was it something i said?"],
          ["i'm sorry!"],
          ["please", "i beg for your forgiveness","and your approval"],
          ["hey!", "i didn't do anything wrong"],
          ["hey","that hurts", "i guess i'll just see you around then."],
          ["hey!","╭∩╮（︶︿︶）╭∩╮","...","wait","i'm ashamed of myself."],
          ["hey!","and I mean this in the best possible way...","ᶠᶸᶜᵏ♥ᵧₒᵤ"],
          ["hey!","don't be a","8=====D", "actually...", "more like a","8=D", "LOLZ", "mad burn"],
          ["(╯︵╰,)"],
        ].randomElement();
        if (response) { queOutput(response, delay); }
        break;
      case "yesnoquestion":
        queOutput(["hmm...", "let me think about that...", "i was just thinking about that..", "", "", ""].randomElement());

        var outcomes = ["yes", "yes", "yes", "no", "no", "maybe", "uknown", "icant", "secret"];

        var asciiSum = 0;

        for (var i = 0; i < string.length; i++) {
          asciiSum += string.charCodeAt(i);
        }

        var outcome = outcomes[asciiSum % (outcomes.length)];
        response = [];
        switch (outcome) {
          case "yes":
            response.push([
              "yes!!!",
              "yes.",
              "yep",
              ["yeah.", "i think so"]
            ].randomElement());
            break;
          case "no":
            response.push([
              "no",
              "never",
              "nope",
              ["not now", "not ever"]
            ].randomElement());
            break;
          case "maybe":
            response.push([
              "maybe",
              ["maybe", "if you want it enough"]
            ].randomElement());
            break;
          case "uknown":
            response.push([
              ["i have to say","i don't know."],
              ["i wish i knew", "but i do not"],
              "i don't know",
              "i don't know everything!",
              "i know nothing jon snow",
            ].randomElement());
            break;
          case "icant":
            response.push([
              ["you know I can't tell you that!"],
              ["I wish I could say", "but I can not"],
              "I can't say"
            ].randomElement());
            break;
          case "secret":
            response.push([
              ["a script doctor never sells his secrets", "or does he?"],
              ["that's a secret!"],
              ["that information will go with me to my grave!", "or", "i'll tell you for $20"],
              ["i took an oath never to say"]
            ].randomElement());
            break;
        }

        delay = 2000;
        for (var i = 0; i < response.length; i++) {
          queOutput(response[i], delay);
        }

        if(Math.random() > 0.6) {
          queQuestion(string, ["i knew it!", "your secret is safe with me.", "i'm telling everyone!"].randomElement(), ["i thought we were friends :(", "fine. be that way", "i didn't care anyways"].randomElement(), 20000);
        }

        break;
    }
  };



  var statementType = function(string) {
    // greeting
    // command
    // statement
    // emote
    var greetingStrings = ["hi", "hello", "sup", "yo", "hey"];
    var thanksStrings = ["thank", "thanks"];
    var commandStrings = ["need", "idea", "help", "joke", "tour", "shut", "read", "stop", "continue"];
    var laughStrings = ["heh", "ha", "hah", "haha", "lol", "lul", "lolz", "lols", "rofl", "hahaha"];
    var positiveStrings = [":)", ":D", "xD", "yay", "hooray", "awesome"];
    var negativeStrings = [":(", ":/"];
    var swearStrings = ["fuck", "bitch"];
    var sorryStrings = ["sorry"];

    var wordList = string.split('.').join('').split('!').join('').split(' ');
    for (var i = 0; i < wordList.length; i++) {
      if (greetingStrings.indexOf(wordList[i]) != -1) {
        return "greeting";
      }
      if (thanksStrings.indexOf(wordList[i]) != -1) {
        return "thanks";
      }
      if (commandStrings.indexOf(wordList[i]) != -1) {
        return wordList[i];
      }
      if (laughStrings.indexOf(wordList[i]) != -1) {
        return "laugh";
      }
      if (positiveStrings.indexOf(wordList[i]) != -1) {
        return "positive";
      }
      if (negativeStrings.indexOf(wordList[i]) != -1) {
        return "negative";
      }
      if (swearStrings.indexOf(wordList[i]) != -1) {
        return "swear";
      }
      if (sorryStrings.indexOf(wordList[i]) != -1) {
        return "sorry";
      }
    }

    return "unknownstatement";

  };



  var specificQuestion = function(string) {


    for (var i = 0; i < specificQuestions.length; i++) {
      if (string == specificQuestions[i][0]) {
        return "specificquestion";
      }
    }
    return false;
  };


  var questionType = function(string) {

    string = string.split("?").join("");

    if (specificQuestion(string)) { return "specificquestion"; }

    var yesnoquestionStart = ["you", "is", "do", "can", "have", "must", "did", "will", "am", "should", "could", "would", "are", "arent", "isnt"];
    var qualityQuestionStart = ["what", "whats", "what's", "where", "wheres", "where's", "when", "why", "which", "who", "whose", "how"];
    var greetingStrings = ["hi", "hello", "sup", "yo", "hey"];

    var wordList = string.split('.').join('').split('!').join('').split(' ');

    if (yesnoquestionStart.indexOf(wordList[0]) != -1) {
      return "yesnoquestion";
    }

    if (qualityQuestionStart.indexOf(wordList[0]) != -1) {
      return "qualityquestion";
    }

    if (greetingStrings.indexOf(wordList[0]) != -1) {
      return "greetingquestion";
    }

    return "confusionquestion";
  };

  var responseType = function(string) {
    // question
    // affirmative
    // negative
    // statement

    var affirmativeStrings = ["yeah", "yes", "yep", "yah","sure","ok","alright", "mhm", "mmhmm", "k", "kinda", "sort", "somewhat", "good", "great","fantastic","super"];
    var negativeStrings = ["no","nope","not","don't", "dont","im ok","suck","sucks","shit","bad"];

    if (string.indexOf("?") != -1) {
      return "question";
    }

    var wordList = string.split('.').join('').split('!').join('').split(' ');
    for (var i = 0; i < wordList.length; i++) {
      if (negativeStrings.indexOf(wordList[i]) != -1) {
        return "negative";
      }
      if (affirmativeStrings.indexOf(wordList[i]) != -1) {
        return "affirmative";
      }
    }

    return "statement";
  };

  window.scriptDoctor = {
    start: start,
    input: input
  };

}).call(this);
