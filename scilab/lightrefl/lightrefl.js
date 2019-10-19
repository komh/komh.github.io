window.addEventListener("load", function() {
  function $(selector) {
    if (selector.charAt(0) === "#")
      return document.querySelector(selector);
    
    return document.querySelectorAll(selector);
  };

  function d2r(deg) {
    return deg / 180 * Math.PI;
  }  

  function r2d(rad) {
    return rad / Math.PI * 180;
  }

  var area = $("#canvas-area");
  var bg = $("#canvas-bg");
  var fg = $("#canvas-fg");

  var bgCtx = bg.getContext("2d");
  var fgCtx = fg.getContext("2d");

  var xOrg = 0;
  var yOrg = 0;

  var proR = 0;

  var rotatedAngle = 0;
  var dragging = false;

  // reset variables in according to a window size
  function reset() {
    bg.width = fg.width = window.innerWidth * 3 / 4;
    bg.height = fg.height = window.innerHeight * 4 / 5;

    // adjust height of a container
    area.style.height = fg.height + "px";

    xOrg = fg.width / 2;
    yOrg = fg.height * 9.5 / 10;

    // radius of a protractor
    proR = fg.width * 1.4  / 4;
  }

  // draw background. a protractor
  function drawBackground() {
    bgCtx.clearRect(0, 0, bg.width, bg.height);

    // a mirror 
    bgCtx.fillStyle = "yellow";
    bgCtx.fillRect(0, yOrg, bg.width, proR / 50);

    bgCtx.translate(xOrg, yOrg);

    bgCtx.beginPath();

    // half circle of a protractor
    bgCtx.arc(0, 0, proR, d2r(180), 0);

    var fontSize = 0.5 * proR / 10;
    bgCtx.font = fontSize.toFixed(1) + "px sans-serif";
    for (var deg = -90; deg <= 90; deg++) {
      // rotate angle
      bgCtx.rotate(d2r(deg));

      // graduation, long every 5 degree
      var ratio = deg % 5 === 0 ? 10 : 20;

      bgCtx.moveTo(0, -proR);
      bgCtx.lineTo(0, -proR + proR / ratio);

      // number every 10 degree
      if (deg % 10 === 0) {
        var angle = deg + 90;
        var fontY = -proR + 1.5 * proR / 10;

        // 0 to 180 at upper
        bgCtx.fillStyle = "white";
        bgCtx.fillText(angle, -bgCtx.measureText(angle).width / 2, fontY);

        // 180 to 0 at lower
        angle = 180 - angle;
        bgCtx.fillText(angle, -bgCtx.measureText(angle).width / 2,
                       fontY + fontSize);
      }

      // line to center of a protractor every 90 degree
      if (deg % 90 === 0) {
        bgCtx.moveTo(0, -proR + 2.5 * proR / 10);
        bgCtx.lineTo(0, 0);
      }

      // restore rotated angle
      bgCtx.rotate(-d2r(deg));
    }

    bgCtx.translate(-xOrg, -yOrg);

    bgCtx.lineWidth = 1;
    bgCtx.strokeStyle = "white";
    bgCtx.stroke();
  }

  // draw foreground. pointer, incident light and reflected light
  function drawForeground() {
    var w = proR / 10;
    var h = w * 1.5;

    fgCtx.clearRect(0, 0, fg.width, fg.height);

    fgCtx.translate(xOrg, yOrg);

    // rotate for incident light
    fgCtx.rotate(d2r(rotatedAngle));

    // draw a pointer
    fgCtx.fillStyle = "white";
    fgCtx.fillRect(-w / 2, -proR - 2 * h, w, h);

    // draw a outline of a pointer
    fgCtx.strokeStyle = "black";
    fgCtx.strokeRect(-w / 2, -proR - 2 * h, w, h);

    fgCtx.lineWidth = 1;
    fgCtx.strokeStyle = "red";

    // draw an incident light
    if ($("#in-light").checked) {
      fgCtx.beginPath();
      fgCtx.moveTo(0, -proR - 1.5 * h);
      fgCtx.lineTo(0, 0);
      
      fgCtx.stroke();
    }

    // restore rotated angle and rotate for a reflected light
    fgCtx.rotate(-d2r(rotatedAngle) * 2);

    // draw a reflected light
    if ($("#refl-light").checked) {
      fgCtx.beginPath();
      fgCtx.moveTo(0, -proR - 1.5 * h);
      fgCtx.lineTo(0, 0);

      fgCtx.stroke();
    }

    // restore rotated angle
    fgCtx.rotate(d2r(rotatedAngle));

    fgCtx.translate(-xOrg, -yOrg);    

    var fontSize = proR / 10;

    fgCtx.font = fontSize.toFixed(1) + "px sans-serif";
    fgCtx.fillStyle = "white";
    
    var angle = Math.round(Math.abs(rotatedAngle));

    // show incident angle
    if ($("#in-angle").checked) {
      fgCtx.fillText("입사각: " + angle, 0, fontSize);
    }

    // show reflected angle
    if ($("#refl-angle").checked) {
      fgCtx.fillText("반사각: " + angle, 0, fontSize * 2);
    }
  }

  reset();
  drawBackground();
  drawForeground();

  // register event listener for mousedown and touchstart event
  ["mousedown", "touchstart"].forEach(function(event) {
    fg.addEventListener(event, function(e) {
      var w = proR / 10;
      var h = w * 1.5;

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

      fgCtx.translate(xOrg, yOrg);
      fgCtx.rotate(d2r(rotatedAngle));

      fgCtx.beginPath();
      fgCtx.rect(-w / 2, -proR -2 * h, w, h);

      // check if hitted
      if (fgCtx.isPointInPath(offsetX, offsetY)) {
        dragging = true;

        e.preventDefault();
      }

      fgCtx.rotate(-d2r(rotatedAngle));
      fgCtx.translate(-xOrg, -yOrg);
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

        // bound check and calc an new angle
        if (offsetY > yOrg)
          rotatedAngle = offsetX > xOrg ? 90 : -90;
        else
          rotatedAngle = 90 + r2d(Math.atan2(offsetY - yOrg, offsetX - xOrg));
  
        drawForeground();

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
  ["#in-light", "#refl-light", 
   "#in-angle", "#refl-angle"].forEach(function(id) {
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
