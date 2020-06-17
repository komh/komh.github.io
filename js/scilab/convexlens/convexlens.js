window.addEventListener("load", function() {
  function $(selector) {
    if (selector.charAt(0) === "#")
      return document.querySelector(selector);
    
    return document.querySelectorAll(selector);
  };

  function d2r(deg) {
    return deg / 180 * Math.PI;
  }  

  var area = $("#canvas-area");
  var bg = $("#canvas-bg");
  var fg = $("#canvas-fg");

  var bgCtx = bg.getContext("2d");
  var fgCtx = fg.getContext("2d");

  var xMid = 0;
  var yMid = 0;

  var lensX = 0;
  var lensY = 0;

  var lensH = 0; 
  var lensW = 0;

  var lensFocus = 0;

  var arrowX = undefined;
  var arrowY = 0;

  var arrowH = 0;   
  var arrowW = 0;

  var dragging = false;
  var diffX = 0;

  var prevX = undefined;
  var prevFocus = undefined;

  // reset variables in according to a window size
  function reset() {
    bg.width = fg.width = window.innerWidth;
    bg.height = fg.height = window.innerHeight * 8.5 / 10;

    // adjust height of a container
    area.style.height = fg.height + "px";

    midX = fg.width / 2;
    midY = fg.height / 2;

    lensX = fg.width / 2;
    lensY = fg.height / 2;

    lensW = fg.width / 15;
    lensH = fg.height * 2 / 3;

    lensFocus = lensW * 2;

    if (prevX === undefined)
      prevX = lensX;

    if (prevFocus === undefined)
      prevFocus = lensFocus;

    if (arrowX === undefined)
      arrowX = lensX - lensFocus * 3 / 2;

    // scale on resize
    arrowX = lensX - (prevX - arrowX) / prevFocus * lensFocus;
    arrowY = fg.height / 2;

    arrowW = lensFocus / 4;
    arrowH = fg.height / 6;

    prevX = lensX;
    prevFocus = lensFocus;
  }

  // draw a tick
  function drawTick(x, y)
  {
    var h = lensH / 30;

    bgCtx.beginPath();

    bgCtx.moveTo(x, y - h);
    bgCtx.lineTo(x, y + h);

    bgCtx.lineWidth = 1;
    bgCtx.strokeStyle = "white";
    bgCtx.stroke();
  }

  // draw background. mid line and lens
  function drawBackground() {
    bgCtx.clearRect(0, 0, bg.width, bg.height);

    bgCtx.beginPath();

    // middle line
    bgCtx.moveTo(0, midY);
    bgCtx.lineTo(bg.width, midY);

    // lens
    bgCtx.moveTo(lensX, midY - lensH / 2);
    bgCtx.quadraticCurveTo(lensX - lensW / 2, lensY, 
                           lensX, lensY + lensH / 2);
    bgCtx.quadraticCurveTo(lensX + lensW / 2, 
                           lensY, lensX, lensY - lensH / 2);

    bgCtx.lineWidth = 1;
    bgCtx.strokeStyle = "white";
    bgCtx.stroke();

    // center of lens
    drawTick(lensX, lensY);

    // focus tick
    drawTick(lensX - lensFocus, lensY);
    drawTick(lensX - lensFocus * 2, lensY);
    drawTick(lensX + lensFocus, lensY);
    drawTick(lensX + lensFocus * 2, lensY);
  }

  // draw arrow  
  function drawArrow(x, scale, draw) {
    var rectW = arrowW * scale;
    var rectH = arrowH * 2 / 3 * scale;

    fgCtx.beginPath();

    // rectangle
    fgCtx.rect(x - rectW / 2, arrowY - rectH, 
               rectW, rectH);

    // triangle
    fgCtx.moveTo(x - rectW, arrowY - rectH);
    fgCtx.lineTo(x, arrowY - arrowH * scale);
    fgCtx.lineTo(x + rectW, arrowY - rectH);
    fgCtx.closePath();

    if (draw === undefined || draw) {
      fgCtx.lineWidth = 1;
      fgCtx.strokeStyle = "white";
      fgCtx.stroke();
    }
  }

  // draw real image
  function drawReal() {
    drawArrow(arrowX, 1);
  }

  // draw incident, refracted and extended ray
  function drawRay() {
    function calcX(x1, y1, x2, y2, y) {
      return (x2 - x1 ) / (y2 - y1) * (y - y1) + x1;
    }

    function calcY(x1, y1, x2, y2, x) {
      return (y2 - y1) / (x2 - x1) * (x - x1) + y1;
    }

    function drawLine(x1, y1, x2, y2, dashed) {
      fgCtx.beginPath();
      
      fgCtx.setLineDash(dashed ? [5, 5] : []);
      fgCtx.moveTo(x1, y1);
      fgCtx.lineTo(x2, y2);

      fgCtx.stroke();
    }

    var rayX = arrowX;
    var rayY = arrowY - arrowH;

    var showExtRay = $("#extended-ray").checked;

    fgCtx.lineWidth = 1;
    fgCtx.strokeStyle = "white";

/*
    // extended parallel incident ray
    
    if (showExtRay)
      drawLine(0, rayY, rayX, rayY, true);
*/

    // parallel incident ray
    if ($("#parallel-ray").checked)
      drawLine(rayX, rayY, lensX, rayY);

    // extended refracted ray
    if (showExtRay)
      drawLine(calcX(lensX, rayY, 
                     lensX + lensFocus, lensY, 0), 0, 
               lensX, rayY, true);

    // refracted parallel ray
    if ($("#refracted-parallel-ray").checked)
      drawLine(lensX, rayY, 
               fg.width, calcY(lensX, rayY, 
                               lensX + lensFocus, lensY, 
                               fg.width));

    // extended incident ray to center of lens
    if (showExtRay)
      drawLine(calcX(rayX, rayY, lensX, lensY, 0), 0, 
               rayX, rayY, true);

    // incident ray to center of lens
    if ($("#center-ray").checked)
      drawLine(rayX, rayY, lensX, lensY);

    // refracted ray from center of lens
    if ($("#refracted-center-ray").checked)
      drawLine(lensX, lensY,
               fg.width, calcY(rayX, rayY, lensX, 
                               lensY, fg.width));
  }

  // draw virtual image
  function drawVirtual()
  {
    if ($("#virtual-image").checked) {
      var a = lensX - arrowX;
      var b = 1 / (1 / lensFocus - 1 / a);

      drawArrow(lensX + b, -b / a);
    }
  }

  // draw foreground. real image, virtual image and ray
  function drawForeground() {
    fgCtx.clearRect(0, 0, fg.width, fg.height);

    drawReal();
    drawRay();
    drawVirtual();
  }

  reset();
  drawBackground();
  drawForeground();

  // register event listener for mousedown and touchstart event
  ["mousedown", "touchstart"].forEach(function(event) {
    fg.addEventListener(event, function(e) {
      var offsetX = 0;
      var offsetY = 0;

      if (e.touches) {
        // touchstart
        var rect = fg.getBoundingClientRect();

        offsetX = e.touches[0].clientX - rect.left;
        offsetY = e.touches[0].clientY - rect.top;
      } else {
        // mousedown
        offsetX = e.offsetX;
        offsetY = e.offsetY;
      }

      drawArrow(arrowX, 1, false);

      // check if hitted
      if (fgCtx.isPointInPath(offsetX, offsetY)) {
        dragging = true;
        diffX = offsetX - arrowX;

        e.preventDefault();
      }
    });
  });

  // register event listener for mousemove and touchmove event
  ["mousemove", "touchmove"].forEach(function(event) {
    window.addEventListener(event, function(e) {
      if (dragging) {
        var offsetX = 0;
        var offsetY = 0;

        if (e.touches) {
          // touchmove
          offsetX = e.touches[0].clientX;
          offsetY = e.touches[0].clientY;
        } else {
          // mousemove
          offsetX = e.clientX;
          offsetY = e.clientY;
        }

        var rect = fg.getBoundingClientRect();

        offsetX -= rect.left;
        offsetY -= rect.top;

        // apply diff
        offsetX -= diffX;

        // bound check
        if (offsetX >= 0 && offsetX <= lensX) {
            arrowX = offsetX;
 
            drawForeground();
        }

        e.preventDefault();
      }
    });
  });

  // register event listener for mouseup and touchend event
  ["mouseup", "touchend"].forEach(function(event) {
    window.addEventListener(event, function(e) {
      if (dragging) {
        dragging = false;

        e.preventDefault();
      }
    });
  });

  // register event listener for change event
  ["#parallel-ray", "#center-ray",
   "#refracted-parallel-ray", "#refracted-center-ray",
   "#virtual-image", "#extended-ray"].forEach(function(id) {
    $(id).addEventListener("change", function() {
      drawForeground();
    });
  });

  // register event listener for resize event
  window.addEventListener("resize", function() {
    reset();
    drawBackground();
    drawForeground();
  });
});
