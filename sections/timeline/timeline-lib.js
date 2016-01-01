// from: http://madoxlabs.github.io/Misc/timeline.html

///////////////
// Game object is a singleton that represents the app itself.
///////////////
var Game = {};

var markerHeaderHeight = 15;
var markerHeaderColor = "#F5F5DC";
var markerColor = "#00FF00";
var pushColor = "#FF0000";
var lineHeaderHeight = 15;
var lineHeaderColor = "#F5F5DC";
var lineColor = "#0000FF";
var lineSeparation = 50;

Game.init = function ()
{
  this.clear();
  this.surface = document.getElementById('surface');
  this.surface.addEventListener("click", onClick, false);
  this.surface.addEventListener("mousedown", onMouseDown, false);
  this.surface.addEventListener("mouseup", onMouseUp, false);
  this.surface.addEventListener("mouseout", onMouseOut, false);
  this.surface.addEventListener("mousemove", onMouseMove, false);
  this.context = this.surface.getContext('2d');
  this.context.font = "12px Verdana";

  this.lastTime = 0;
  this.time = 0;
  this.updateTime = 0;

  this.inputTitle = document.getElementById("title");
  this.inputBody = document.getElementById("text");

  initList();
  newLine();
}

Game.clear = function()
{
  this.maxResize = 0;
  this.minPush = null;
  this.move = false;
  this.moveMarker = false;
  this.moveMarkerId = 0;
  this.moveObject = false;
  this.sizeObject = false;
  this.moveObjectId = 0;
  this.noClick = false;
  this.picker = false;  // show color picker
  this.pickerImg = null;
  this.editObject = null;
  this.moveLock = 0;  // 1 scroll 2 zoom
  this.chapterMode = false;
  this.offset = 0;   // left/right scroll state
  this.zoom = 1;     // zoom factor
  this.lines = [];
  this.objects = [];
  this.markers = [];
  this.fontsize = 12;
}

Game.stdout = function (text)
{
  document.getElementById('stdout').innerHTML = text;
  console.log(text);
}

Game.run = function ()
{
  var d = new Date();
  Game.lastTime = Game.time;
  Game.time = d.getTime();

  Game.update();
  d = new Date();
  var updateTime = d.getTime() - Game.time;

  Game.draw();
  d = new Date();
  var drawTime = d.getTime() - Game.time;

  var idleTime = 17 - updateTime - drawTime;

  Game.context.font = "8px Arial";
  Game.context.fillStyle = "#ffffff";
  if (idleTime < 0) { idleTime = 0; Game.context.fillStyle = "#ff0000"; }
  var perFrame = idleTime + drawTime + updateTime;

  Game.context.fillText("FPS: " + ((1000 / perFrame) | 0) + "  Each frame: " + perFrame + " ms", lineHeaderHeight, 600 - 30);
  Game.context.fillText("Frame Time: Update: " + updateTime + "ms  Draw: " + drawTime + "ms  Idle: " + idleTime + "ms", lineHeaderHeight, 600 - 20);
  updateTime = (updateTime / perFrame * 100) | 0;
  drawTime = (drawTime / perFrame * 100) | 0;
  idleTime = (idleTime / perFrame * 100) | 0;
  Game.context.fillText("Frame Time: Update: " + updateTime + "%  Draw: " + drawTime + "%  Idle: " + idleTime + "%", lineHeaderHeight, 600 - 10);
}

Game.update = function ()
{
  Game.updateTime += (Game.time - Game.lastTime);
  if (Game.updateTime > 500 && Game.editObject != null)
  {
    Game.updateTime = 0;
    onTitleChange();
    onBodyChange();
  }
}

Game.draw = function ()
{
  // clear to black
  Game.context.font = Game.fontsize + "px Arial";
  Game.context.fillStyle = "black";
  Game.context.fillRect(0, 0, 800, 600);
  Game.context.lineWidth = 1;

  // draw the marker creation header
  Game.context.strokeStyle = markerHeaderColor;
  Game.context.fillStyle = markerHeaderColor;
  Game.context.fillRect(0, 0, 800, markerHeaderHeight);

  // if nothing is being moved, we can draw ghost objects to help the user
  if (Game.moveMarker == false && Game.moveObject == false && Game.move == false && Game.chapterMode == false) {
    // Draw ghost marker
    if (Game.mouseY < markerHeaderHeight && hitMarker(Game.mouseX) == false && hitObjectCol(Game.mouseX) == false) {
      var m = Game.mouseX;
      var rgb = "rgba(0,255,0,0.5)";
      Game.context.strokeStyle = rgb;
      Game.context.fillStyle = rgb;
      Game.context.fillRect(m / Game.zoom - 3, 5, 6, 10);
      Game.context.fillRect(m / Game.zoom, 5, 1, 600);
    }

    // Draw ghost object
    if (hitObject(Game.mouseX, Game.mouseY, false) == false && hitMarkerRange(Game.mouseX, 30) == false) {
      // closest line that is 10 away
      var y = 0;
      var i = 0;
      for (; i < Game.lines.length; ++i) {
        if (Math.abs(Game.mouseY - (lineSeparation * (i + 1))) < 20) { y = lineSeparation * (i + 1); break; }
      }
      if (y > 0) {
        var rgb = "rgba(" + Game.lines[i].r + "," + Game.lines[i].g + "," + Game.lines[i].b + ",0.5)";
        Game.context.strokeStyle = rgb;
        Game.context.fillStyle = rgb;
        roundRect(Game.context, Game.mouseX / Game.zoom, (y - 10) / Game.zoom, 30 / Game.zoom, 20 / Game.zoom, 10 / Game.zoom, true, true);
      }
    }
  }

  // Draw Lines
  for (var i = 0; i < Game.lines.length; ++i) {
    var loc = lineSeparation * (i + 1);
    Game.context.strokeStyle = Game.lines[i].color;
    Game.context.fillStyle = Game.lines[i].color;
    Game.context.fillRect(5, loc / Game.zoom, 800, 1);
  }

  // Draw objects
  {
    for (var i in Game.objects) {
      var o = Game.objects[i];
      if (o.delete) continue;
      Game.context.strokeStyle = o.color;
      Game.context.fillStyle = o.color;
      roundRect(Game.context, (Game.offset + o.loc) / Game.zoom, ((o.line * lineSeparation) - 10) / Game.zoom, o.width / Game.zoom, 20 / Game.zoom, 10 / Game.zoom, true, true);
      // text - offset it by 20, workout the length per letter and chop it off as needed     
      Game.context.strokeStyle = getContrastColor(o.r, o.g, o.b);
      Game.context.fillStyle = Game.context.strokeStyle;
      Game.context.fillText(fitString(o.text, o.width - 25), (Game.offset + o.loc + 20) / Game.zoom, (o.line * lineSeparation + Game.fontsize / 2) / Game.zoom);
    }
  }

  // draw the line creation header
  Game.context.strokeStyle = lineHeaderColor;
  Game.context.fillStyle = lineHeaderColor;
  Game.context.fillRect(0, markerHeaderHeight, lineHeaderHeight, 600);

  // Draw Line thumbs
  for (var i = 0; i < Game.lines.length; ++i) {
    var loc = lineSeparation * (i + 1);
    Game.context.strokeStyle = Game.lines[i].color;
    Game.context.fillStyle = Game.lines[i].color;
    Game.context.fillRect(5, loc / Game.zoom - 3, 10, 6);
    //draw a circle
    Game.context.beginPath();
    Game.context.arc(9, loc/Game.zoom-9, 5, 0, Math.PI * 2, true);
    Game.context.closePath();
    Game.context.fill();
  }

  // Draw Markers
  for (var i in Game.markers) {
    var m = Game.markers[i];
    if (m.delete) continue;
    Game.context.strokeStyle = m.pushmode ? pushColor : markerColor;
    Game.context.fillStyle = m.pushmode ? pushColor : markerColor;
    Game.context.fillRect((Game.offset + m.loc) / Game.zoom - 3, 5, 6, 10);
    Game.context.fillRect((Game.offset + m.loc) / Game.zoom, 5, 1, 600);

    //draw a circle
    Game.context.beginPath();
    Game.context.arc((Game.offset + m.loc) / Game.zoom + 9, 9, 5, 0, Math.PI * 2, true);
    Game.context.closePath();
    Game.context.fill();
  }

  // draw the picker
  if (Game.picker) {
    if (Game.pickerImg == null) {
      Game.pickerImg = new Image();
      Game.pickerImg.src = 'lightbox.png';
      Game.pickerImg.onload = function ()
      {
        Game.context.drawImage(Game.pickerImg, 0, 0, 104, 117, 400 - 104, 300 - 117, 208, 234);
      }
    }
    else
      Game.context.drawImage(Game.pickerImg, 0, 0, 104, 117, 400 - 104, 300 - 117, 208, 234);
  }
  else {
    // draw tooltip for object text
    if (Game.moveMarker == false && Game.moveObject == false && Game.move == false)
    {
      var o = null;
      if (hitObject(Game.mouseX, Game.mouseY)) o = Game.objects[Game.moveObjectId];
      else if (hitMarker(Game.mouseX) && Game.mouseY < markerHeaderHeight) o = Game.markers[Game.moveMarkerId];
      else if (Game.mouseX < lineHeaderHeight && (Game.mouseY % lineSeparation) > 5 && ((Game.mouseY / lineSeparation) | 0) < Game.lines.length) o = Game.lines[(Game.mouseY / lineSeparation) | 0];
      
      if (o !== null)
      {
        Game.context.font = "12px Arial";
        var w = Game.context.measureText(o.text).width;
        var x = Game.mouseX;
        var y = Game.mouseY;
        Game.context.strokeStyle = "#777777";
        Game.context.fillStyle = "#777777";
        Game.context.fillRect(x / Game.zoom, y / Game.zoom, w + 12, 20);
        Game.context.strokeStyle = "#aaaaaa";
        Game.context.fillStyle = "#aaaaaa";
        Game.context.fillRect(x / Game.zoom + 3, y / Game.zoom + 3, w + 6, 20 - 6);
        Game.context.strokeStyle = "#000000";
        Game.context.fillStyle = "#000000";
        Game.context.fillText(o.text, x / Game.zoom + 6, y / Game.zoom + 3 + 12);
      }
    }
  }

  // chapter mode button
  Game.context.strokeStyle = !Game.chapterMode ? "#00ff00" : "#ff0000";
  Game.context.fillStyle = !Game.chapterMode ? "#00ff00": "#ff0000";
  Game.context.fillRect(0, 0, markerHeaderHeight, lineHeaderHeight);

  if (Game.chapterMode)
  {
    for (var i in Game.markers) {
      var m = Game.markers[i];
      if (m.delete) continue;

      var w = 99999999999;
      for (var j in Game.markers) {
        var mj = Game.markers[j];
        if (mj.delete) continue;
        if (mj.loc-m.loc < w && mj.loc > m.loc) w = mj.loc-m.loc;
      }
      if (w == 99999999999)
      {
        w = 0;
        for (var j in Game.objects) {
          var o = Game.objects[j];
          if (o.delete) continue;
          if (o.loc >= m.loc && o.loc + o.width - m.loc > w) w = o.loc + o.width - m.loc;
        }
      }
      if (w == 0) w = 100;
      if (Game.moveMarker && Game.moveMarkerId == i)
      {
        Game.context.strokeStyle = "rgba(255,0,120,0.75)";
        Game.context.fillStyle = "rgba(255,0,120,0.75)";
      } else 
      {
        Game.context.strokeStyle = "rgba(255,255,120,0.75)";
        Game.context.fillStyle = "rgba(255,255,120,0.75)";
      }
      Game.context.fillRect((Game.offset + m.loc) / Game.zoom + 4, markerHeaderHeight + 4, w / Game.zoom - 4, 800 - 8 - markerHeaderHeight);
      drawRotateText((Game.offset + m.loc) / Game.zoom + 10, markerHeaderHeight + 10 / Game.zoom + 10, m.text, (w-15) / Game.zoom);
    }
  }
}

function drawRotateText(x, y, text, w)
{
  Game.context.save();
  Game.context.font = "12px Arial";
  var textw = Game.context.measureText(text).width;
  if (w != null && textw > w)
  {
    Game.context.translate(x, y);
    Game.context.rotate(Math.PI / 2);
    Game.context.translate(-x, -y);
  }
  Game.context.strokeStyle = "#000000";
  Game.context.fillStyle = "#000000";
  Game.context.fillText(text,x,y);
  Game.context.restore();
}

///////////////
// Hit Testers
///////////////
function hitMarker(x, set, self)  // sets the marker id
{
  if (typeof (set) === 'undefined') set = true;

  x = x - Game.offset;
  for (i in Game.markers) {
    if (self !== undefined && i == self) continue;
    if (Game.markers[i].delete) continue;

    var loc = Game.markers[i].loc;
    if (Math.abs(loc+8 - x) <= 10) {
      if (set) Game.moveMarkerId = i;
      return true;
    }
  }
  return false;
}

function hitMarkerText(x, set, self)  // sets the marker id
{
  if (typeof (set) === 'undefined') set = true;

  x = x - Game.offset;
  for (i in Game.markers) {
    if (self !== undefined && i == self) continue;
    if (Game.markers[i].delete) continue;

    var loc = Game.markers[i].loc;
    if (Math.abs(loc + 12 - x) <= 4) {
      if (set) Game.moveMarkerId = i;
      return true;
    }
  }
  return false;
}

function hitMarkerRange(x, w)
{
  x = x - Game.offset;
  for (i in Game.markers) {
    if (Game.markers[i].delete) continue;

    var loc = Game.markers[i].loc;
    if (loc > x && loc < x + w) {
      return true;
    }
  }
  return false;
}

function hitObject(x, y, set, self)  // sets the object id (if self is null)
{
  if (typeof (set) === 'undefined') set = true;

  x = x - Game.offset;
  for (i in Game.objects) {
    if (self !== undefined && i == self) continue;
    if (Game.objects[i].delete) continue;

    var o = Game.objects[i];
    if ((x < o.loc + o.width) && (x > o.loc) && (Math.abs(o.line * lineSeparation - y) < 10)) {
      if (set) Game.moveObjectId = i;
      return true;
    }
  }
  return false;
}

function hitObjectRange(x, y, w, self)
{
  x = x - Game.offset;
  for (i in Game.objects) {
    if (self !== undefined && i == self) continue;
    if (Game.objects[i].delete) continue;

    var o = Game.objects[i];
    if (Math.abs(o.line * lineSeparation - y) >= 10) continue; // different lines
    if (o.loc < x && o.loc + o.width < x) continue;  // entirely to the left
    if (o.loc > (x + w) && (o.loc + o.width) > (x + w)) continue;  // entirely to the right
    return true;
  }
  return false;
}

function hitObjectCol(x, self)
{
  x = x - Game.offset;
  for (i in Game.objects) {
    if (self !== undefined && i == self) continue;
    if (Game.objects[i].delete) continue;

    var o = Game.objects[i];
    if (x < (o.loc + o.width) && (x > o.loc)) {
      return true;
    }
  }
  return false;
}

function hitObjectText(x, i)
{
  x = x - Game.offset;
  if (Game.objects[i].delete) return false;

  var o = Game.objects[i];
  if (x > (o.loc+20) && x < (o.loc+o.width-5)) return true;
  return false;
}

function findRightChapterWidth(id)
{
  var m = Game.markers[id];
  var data = { id: null, loc: 9999999999 };
  for (var i in Game.markers) if (!Game.markers[i].delete && Game.markers[i].loc > m.loc && Game.markers[i].loc < data.loc) {
    data.id = i;
    data.loc = Game.markers[i].loc;
  }
  if (data.id === null) return { width: 0 };

  id = data.id;
  m = Game.markers[id];
  data.loc = 9999999999;
  for (var i in Game.markers) if (!Game.markers[i].delete && Game.markers[i].loc > m.loc && Game.markers[i].loc < data.loc) {
    data.loc = Game.markers[i].loc;
  }

  if (data.id === null) return { width: 0 };
  return { id: data.id, width: Math.abs(m.loc - data.loc) };
}

function findLeftChapterWidth(id)
{
  var m = Game.markers[id];
  var data = { id: null, loc: 0 };
  for (var i in Game.markers) if (!Game.markers[i].delete && Game.markers[i].loc < m.loc && Game.markers[i].loc > data.loc) {
    data.id = i;
    data.loc = Game.markers[i].loc;
  }
  if (data.id === null) return { width: 0 };
  return { id: data.id, width: Math.abs(m.loc - data.loc) };
}

function swapChapters(fromId, toId, toWidth)
{
  if (toWidth == 0) 
  {
    // detect it
    towidth = 9999999999;
    var m = Game.markers[toId];
    for (var i in Game.markers) if (!Game.markers[i].delete && Game.markers[i].loc > m.loc && Game.markers[i].loc < towidth) {
      towidth = Game.markers[i].loc;
    }
    toWidth = towidth - m.loc;
  }
  var add = {};
  var sub = {};
  var addValue = toWidth;
  var subValue = Game.markers[toId].loc - Game.markers[fromId].loc;
  for (i in Game.objects)
  {
    var o = Game.objects[i];
    if (o.delete) continue;
    if (o.loc > Game.markers[fromId].loc && o.loc < Game.markers[toId].loc)
      add[i] = i; // save it for addition
    else if (o.loc > Game.markers[toId].loc && o.loc < Game.markers[toId].loc+toWidth)
      sub[i] = i; // save it for subtraction
  }
  for (i in add) Game.objects[i].loc += addValue;
  Game.markers[fromId].loc += addValue;
  for (i in sub) Game.objects[i].loc -= subValue;
  Game.markers[toId].loc -= subValue;
}

///////////////
// Event Handlers
///////////////
function onClick(ev)
{
  // if picker is open, get and assign new color
  if (Game.picker > 0) {
    var x = (ev.clientX - Game.surface.offsetLeft);
    var y = (ev.clientY - Game.surface.offsetTop);
    var imgd = Game.context.getImageData(x, y, 1, 1);
    var data = imgd.data;
    var hexString = "#" + RGBtoHex(data[0], data[1], data[2]);
    if (Game.picker == 1) {
      Game.objects[Game.pickObject].r = data[0];
      Game.objects[Game.pickObject].g = data[1];
      Game.objects[Game.pickObject].b = data[2];
      Game.objects[Game.pickObject].color = hexString;
    }
    else if (Game.picker == 2) {
      Game.lines[Game.pickObject].r = data[0];
      Game.lines[Game.pickObject].g = data[1];
      Game.lines[Game.pickObject].b = data[2];
      Game.lines[Game.pickObject].color = hexString;
    }
    if (Game.pickObject == Game.editObject)
    {
      var d = document.getElementById("data");
      d.style.backgroundColor = Game.objects[Game.editObject].color;
    }
    Game.picker = 0;
    return;
  }

  // if this is a click that is really just a mouse up, dont count it as a click
  if (Game.noClick) { Game.noClick = false; return; }

  var x = (ev.clientX - Game.surface.offsetLeft) * Game.zoom;
  var y = (ev.clientY - Game.surface.offsetTop) * Game.zoom;

  if (x / Game.zoom < lineHeaderHeight && y / Game.zoom < markerHeaderHeight)
  {
    Game.chapterMode = !Game.chapterMode;
    return;
  }

  if (Game.chapterMode) return;

  // find closest line that is 10 away for later
  var line = 0;
  for (var i = 0; i < Game.lines.length; ++i) if (Math.abs(Game.mouseY - (lineSeparation * (i + 1))) < 20) { line = i + 1; break; }

  // if clicked on a marker, toggle push mode
  if (y < markerHeaderHeight && hitMarker(x, false)) {
    if (hitMarkerText(x, false) == false) Game.markers[Game.moveMarkerId].pushmode = !Game.markers[Game.moveMarkerId].pushmode;
    else {
      Game.editType = 2;
      Game.editObject = Game.moveMarkerId;
      Game.inputTitle.value = Game.markers[Game.moveMarkerId].text;
      Game.inputBody.value = Game.markers[Game.moveMarkerId].body;
    }
    return;
  }

  // if clicked on an object, trigger picker
  else if (hitObject(x, y, true)) {
    if (hitObjectText(x, Game.moveObjectId))
    {
      Game.editObject = Game.moveObjectId;
      Game.editType = 1;
      var d = document.getElementById("data");
      d.style.backgroundColor = Game.objects[Game.editObject].color;
      Game.inputTitle.value = Game.objects[Game.editObject].text;
      Game.inputBody.value = Game.objects[Game.editObject].body;
    }
    else
    {
      Game.pickObject = Game.moveObjectId;
      Game.picker = 1;
    }
  }

  // if click on top header and there is room, make a new marker
  else if (y/Game.zoom < markerHeaderHeight && hitObjectCol(x) == false) {
    var marker = { loc: x - Game.offset, delete: false, pushmode: false, text: "Marker", body: "" };
    Game.markers.push(marker);
//    Game.markers.sort(function (a, b) { return a.loc - b.loc });
  }

  // if clicked on side header, make a new line or trigger picker depending
  else if (x / Game.zoom < lineHeaderHeight) {
    var line = (Game.mouseY / lineSeparation) | 0;
    var pos = (Game.mouseY % lineSeparation);
    if (line >= 1 && pos <= 3) --line;

    if (line < Game.lines.length)
    {
      if (pos >= 38 && pos <= 45) {
        Game.editType = 3;
        Game.editObject = line;
        Game.inputTitle.value = Game.lines[line].text;
        Game.inputBody.value = Game.lines[line].body;
      }
      else if (pos > 45 || pos <= 3) {
        Game.pickObject = line;
        Game.picker = 2;
      }
    }
    else
      newLine();
  }

  // if clicked on a line, make a new object
  else if (line > 0 && hitMarkerRange(x, 30) == false) {
    var hex = Game.lines[line - 1].color;
    var obj = { line: line, loc: x - Game.offset, width: 40, r: Game.lines[line - 1].r, g: Game.lines[line - 1].g, b: Game.lines[line - 1].b, color: hex, body: "", text: Game.lines[line - 1].text + " event" };
    Game.objects.push(obj);
//    Game.objects.sort(function (a, b) { return a.loc - b.loc });
  }
}

function onMouseDown(ev)
{
  Game.moveX = (ev.clientX - Game.surface.offsetLeft) * Game.zoom;
  Game.moveY = (ev.clientY - Game.surface.offsetTop) * Game.zoom;
  if (Game.chapterMode)
  {
    // find marker we are in
    var data = { id: null, loc: 0 };
    for (var i in Game.markers) if (!Game.markers[i].delete && Game.markers[i].loc < (Game.moveX - Game.offset) && (Game.markers[i].loc > data.loc))
    { 
      data.id = i; 
      data.loc = Game.markers[i].loc;
    }
    Game.moveMarker = true;
    Game.moveMarkerId = data.id;
    return;
  }

  if (Game.moveY < markerHeaderHeight && hitMarker(Game.moveX, true)) {
    Game.moveMarker = true;
    Game.minPush = null;
    return;
  }
  else if (hitObject(Game.moveX, Game.moveY, true)) {
    Game.moveObject = true;
    Game.moveOffset = Game.objects[Game.moveObjectId].loc - Game.moveX + Game.offset;
    if (Game.moveOffset + Game.objects[Game.moveObjectId].width < 5) { Game.sizeObject = true; }
    Game.maxResize = 0;
    return;
  }
  else {
    Game.move = true;
    Game.startZoom = Game.zoom;
    Game.startOffset = Game.offset;
  }
}

function onMouseUp(ev)
{
  if (Game.zoom != Game.startZoom /*|| Game.offset != Game.startOffset*/)
    Game.noClick = true;
  Game.moveMarker = false;
  Game.moveObject = false;
  Game.sizeObject = false;
  Game.move = false;
  Game.maxResize = 0;
  Game.moveLock = 0;
}

function onMouseOut(ev)
{
  Game.moveMarker = false;
  Game.moveObject = false;
  Game.sizeObject = false;
  Game.move = false;
  Game.maxResize = 0;
}

function onMouseMove(ev)
{
  Game.mouseX = (ev.clientX - Game.surface.offsetLeft) * Game.zoom;
  Game.mouseY = (ev.clientY - Game.surface.offsetTop) * Game.zoom;

  if (Game.chapterMode && Game.moveMarker)
  {
    var goingLeft = (Game.moveX > Game.mouseX) ? true : false;
    var w = goingLeft ? findLeftChapterWidth(Game.moveMarkerId) : findRightChapterWidth(Game.moveMarkerId);
    if (w.width == 0) return;
    if (Math.abs(Game.moveX - Game.mouseX) >= w.width)
    {
      if (goingLeft) swapChapters(w.id, Game.moveMarkerId, 0);
      else swapChapters(Game.moveMarkerId, w.id, w.width);
      Game.moveX = Game.mouseX;
      Game.moveY = Game.mouseY;
    }
    return;
  }

  if (Game.moveMarker) {
    Game.noClick = true;
    // if going left, stop at prev marker or object
    if (hitMarker(Game.mouseX, false, Game.moveMarkerId) || hitObjectCol(Game.mouseX)) {
      if (Game.markers[Game.moveMarkerId].pushmode && Game.minPush == null) Game.minPush = Game.mouseX;
    }
    else {
      if (Game.markers[Game.moveMarkerId].pushmode && Game.minPush != null && Game.mouseX <= Game.minPush) return;
      var pos = Game.markers[Game.moveMarkerId].loc;
      var diff = (Game.mouseX - Game.offset) - pos;
      Game.markers[Game.moveMarkerId].loc = Game.mouseX - Game.offset;
      if (Game.markers[Game.moveMarkerId].pushmode) {
        for (var i in Game.markers) if (i != Game.moveMarkerId && Game.markers[i].loc > pos) Game.markers[i].loc += diff;
        for (var j in Game.objects) if (Game.objects[j].loc > pos) Game.objects[j].loc += diff;
      }
    }
    Game.markers[Game.moveMarkerId].delete = (Game.mouseY > markerHeaderHeight + 10 ? true : false)
  }

  else if (Game.moveObject) {
    Game.noClick = true;
    if (Game.sizeObject) {
      var pos = Game.objects[Game.moveObjectId].loc + Game.objects[Game.moveObjectId].width + (Game.mouseX - Game.moveX) + Game.offset;
      if (Game.maxResize && pos >= Game.maxResize) return;
      if (hitMarker(pos, false) == false
          && hitObject(pos, Game.objects[Game.moveObjectId].line * lineSeparation, false, Game.moveObjectId) == false) {
        Game.objects[Game.moveObjectId].width += Game.mouseX - Game.moveX;
        if (Game.objects[Game.moveObjectId].width < 20) Game.objects[Game.moveObjectId].width = 20;
        else Game.moveX = Game.mouseX;
      }
      else
        Game.maxResize = pos;
    }
    else {
      var o = Game.objects[Game.moveObjectId];
      if (hitMarkerRange(Game.mouseX + Game.moveOffset, o.width) == false
          && hitObjectRange(Game.mouseX + Game.moveOffset, o.line * lineSeparation, o.width, Game.moveObjectId) == false)
        Game.objects[Game.moveObjectId].loc = Game.mouseX + Game.moveOffset - Game.offset;

      var line = 0;
      for (var i = 0; i < Game.lines.length; ++i) if (Math.abs(Game.mouseY - (lineSeparation * (i + 1))) < 20) { line = i + 1; break; }

      Game.objects[Game.moveObjectId].delete = (line == 0 ? true : false);
      if (line > 0) {
        if (hitObjectRange(o.loc, line * lineSeparation, o.width, Game.moveObjectId) == false)
          Game.objects[Game.moveObjectId].line = line;
      }
    }
  }

  else if (Game.move)
  {
    if (Game.moveLock == 0)
    {
      if (Math.abs(Game.moveX - Game.mouseX) > Math.abs(Game.moveY - Game.mouseY)) Game.moveLock = 1;
      else Game.moveLock = 2;
    }
    Game.noClick = true;
    if (Game.moveLock != 2) Game.offset += Game.mouseX - Game.moveX;
    Game.moveX = Game.mouseX;

    if (Game.moveLock != 1) Game.zoom = Game.startZoom + ((Game.mouseY - Game.moveY) / Game.zoom) / 200;
    if (Game.zoom < 1) Game.zoom = 1;
    Game.fontsize = (12 / Game.zoom) | 0;
  }
}

function onTitleChange()
{
  if (Game.editObject != null)
  {
    if (Game.editType == 1)
      Game.objects[Game.editObject].text = Game.inputTitle.value;
    else if (Game.editType == 2)
      Game.markers[Game.editObject].text = Game.inputTitle.value;
    else if (Game.editType == 3)
      Game.lines[Game.editObject].text = Game.inputTitle.value;
  }
}

function onBodyChange()
{
  if (Game.editObject != null) {
    if (Game.editType == 1)
      Game.objects[Game.editObject].body = Game.inputBody.value;
    else if (Game.editType == 2)
      Game.markers[Game.editObject].body = Game.inputBody.value;
    else if (Game.editType == 3)
      Game.lines[Game.editObject].body = Game.inputBody.value;
  }
}

function save()
{
  // get filename
  var file = document.getElementById("filename").value;
  if (file.length == 0) { Game.stdout("Missing filename"); return; }
  // create hash of stuff
  var data = { markers: Game.markers, objects: Game.objects, lines: Game.lines };
  // save
  localStorage[file] = JSON.stringify(data);
  document.getElementById("rawdata").value = JSON.stringify(data);
  // create option if needed
  var select = document.getElementById("loadname");
  var add = true;
  for (var i = 0; i < select.length; i++) if (select.options[i].text == file) add = false;
  if (add) select.options[select.options.length] = new Option(file, file);
  // add to list
  var list = localStorage['filelist'];
  if (list === undefined) list = {}; else list = JSON.parse(list);
  list[file] = file;
  localStorage['filelist'] = JSON.stringify(list);
}

function load()
{
  // get filename
  var select = document.getElementById("loadname");
  var filename = select.options[select.selectedIndex].text;
  // load
  var data = JSON.parse(localStorage[filename]);
  document.getElementById("rawdata").value = JSON.stringify(data);
  document.getElementById("filename").value = filename;
  // restore state
  Game.clear();
  Game.markers = data.markers;
  Game.objects = data.objects;
  Game.lines = data.lines;
}

function loadraw()
{
  // load
  var text = document.getElementById("rawdata").value;
  var data = JSON.parse(text);
  // restore state
  Game.clear();
  Game.markers = data.markers;
  Game.objects = data.objects;
  Game.lines = data.lines;
}

function deleteSave()
{
  // get filename
  var select = document.getElementById("loadname");
  var filename = select.options[select.selectedIndex].text;
  // delete from storage
  localStorage.removeItem(filename);
  // delete from list
  var list = localStorage['filelist'];
  if (list === undefined) list = {}; else list = JSON.parse(list);
  delete list[filename];
  localStorage['filelist'] = JSON.stringify(list);
  // rebuild list
  var select = document.getElementById("loadname");
  select.options.length = 0;
  for (var i in list)
    select.options[select.options.length] = new Option(list[i], list[i]);
}

function initList()
{
  var select = document.getElementById("loadname");
  var list = localStorage['filelist'];
  if (list === undefined) list = {}; else list = JSON.parse(list);
  for (var i in list)
    select.options[select.options.length] = new Option(list[i], list[i]);
}
///////////////
// HELPERS
///////////////

function roundRect(ctx, x, y, width, height, radius, fill, stroke)
{
  if (typeof stroke == "undefined") stroke = true;
  if (typeof radius === "undefined") radius = 5;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) ctx.stroke();
  if (fill) ctx.fill();
}

function newLine()
{
  var r = (Math.random() * 255) | 0;
  var g = (Math.random() * 255) | 0;
  var b = (Math.random() * 255) | 0;
  var hex = "#" + RGBtoHex(r, g, b);
  var l = { r: r, g: g, b: b, color: hex, text: "Line "+(Game.lines.length+1), body: "" };
  Game.lines.push(l);
}

function RGBtoHex(R, G, B) { return toHex(R) + toHex(G) + toHex(B); }

function getContrastColor(r, g, b)
{
  var colorL = (0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255));
  var blackL = 0;
  var whiteL = (0.2126 + 0.7152 + 0.0722);
  var blackRatio = Math.round((Math.max(colorL, blackL) + 0.05) / (Math.min(colorL, blackL) + 0.05) * 10) / 10;
  var whiteRatio = Math.round((Math.max(colorL, whiteL) + 0.05) / (Math.min(colorL, whiteL) + 0.05) * 10) / 10;
  if (blackRatio > whiteRatio) return "#000000";
  return "#ffffff";
}

function fitString(text, width)
{
  var min = 0;
  var max = text.length;
  var w = max;

  if (Game.context.measureText(text).width <= width) return text;
  for (var i = 0; i <= max; ++i)
    if (Game.context.measureText(text.substring(0, i)).width > width) return text.substring(0, i - 1);
  return "";
}

function toHex(N)
{
  if (N == null) return "00";
  N = parseInt(N); if (N == 0 || isNaN(N)) return "00";
  N = Math.max(0, N); N = Math.min(N, 255); N = Math.round(N);
  return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
}

///////////////
// Main
///////////////
function main()
{
  Game.init();
  window.setInterval(Game.run, 17);
}
