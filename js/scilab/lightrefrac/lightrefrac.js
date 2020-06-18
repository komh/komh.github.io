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

  var orgX = 0;
  var orgY = 0;

  var proR = 0;

  var ptW = 0;
  var ptH = 0;
  var ptX = 0;
  var ptY = 0;

  var rotatedAngle = 0;
  var dragging = false;

  // reset variables in according to a window size
  function reset() {
    bg.width = fg.width = window.innerWidth * 3 / 4;
    bg.height = fg.height = window.innerHeight * 8.5 / 10;

    // adjust height of a container
    area.style.height = fg.height + "px";

    orgX = fg.width / 2;
    orgY = fg.height / 2;

    // calculate proR and pointer geometry
    ptW = fg.width / 40;
    ptH = ptW * 1.5;

    proR = fg.width / 2 - ptH * 1.5;

    ptX = -ptW / 2;
    ptY = -proR - ptH * 1.5;

    if (ptY + orgY < 0) {
      ptW = fg.height / 40;
      ptH = ptW * 1.5;

      proR = fg.height / 2 - ptH * 1.5;

      ptX = -ptW / 2;
      ptY = -proR - ptH * 1.5;
    }
  }

  // draw background. a protractor
  function drawBackground() {
    bgCtx.clearRect(0, 0, bg.width, bg.height);

    bgCtx.translate(orgX, orgY);

    // a circle of a protractor
    bgCtx.beginPath();

    bgCtx.arc(0, 0, proR, d2r(360), 0);

    bgCtx.lineWidth = 1;
    bgCtx.strokeStyle = "white";
    bgCtx.stroke();

    // lower half circle of a protractor
    bgCtx.beginPath();

    bgCtx.arc(0, 0, proR, 0, d2r(180));

    bgCtx.fillStyle = "blue";
    bgCtx.fill();

    bgCtx.beginPath();

    var fontSize = 0.5 * proR / 10;
    bgCtx.font = fontSize.toFixed(1) + "px sans-serif";
    for (var deg = -180; deg < 180; deg++) {
      // rotate angle
      bgCtx.rotate(d2r(deg));

      // graduation, long every 5 degree
      var ratio = deg % 5 === 0 ? 10 : 20;

      bgCtx.moveTo(0, -proR);
      bgCtx.lineTo(0, -proR + proR / ratio);

      // number every 10 degree
      if (deg % 10 === 0) {
        var angle = deg + 90;

        if (angle > 180)
          angle = 360 - angle;
        else if (angle < 0)
          angle = -angle;

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

    const matterNames = {
      vacuum: "진공",           /* vacuum */
      air: "공기",              /* air */
      water: "물",              /* water */
      glass: "유리",            /* glass */
      diamond: "다이아몬드",    /* diamond */
    };
 
    var matter = $("#matter1");
    var name = matterNames[matter.options[matter.selectedIndex].value];
    
    bgCtx.fillStyle = "white";
    bgCtx.fillText(name, 
                   -proR / 3 - bgCtx.measureText(name).width / 2, -proR / 3);
    bgCtx.fillText(name, 
                   proR / 3 - bgCtx.measureText(name).width / 2, -proR / 3);

    matter = $("#matter2");
    name = matterNames[matter.options[matter.selectedIndex].value];

    bgCtx.fillText(name,
                   -proR / 3 - bgCtx.measureText(name).width / 2, proR / 3);
    bgCtx.fillText(name, 
                   proR / 3 - bgCtx.measureText(name).width / 2, proR / 3);

    bgCtx.translate(-orgX, -orgY);

    bgCtx.lineWidth = 1;
    bgCtx.strokeStyle = "white";
    bgCtx.stroke();
  }

  // draw foreground. pointer, incident light and refracted light
  function drawForeground() {
     const nVals = {
      vacuum: 1,        /* vacuum */
      air: 1.0003,      /* air */
      water: 1.32,      /* water */
      glass: 1.52,      /* glass */
      diamond: 2.42,    /* diamond */
    };

    var matter1 = $("#matter1");
    var n1 = nVals[matter1.options[matter1.selectedIndex].value];

    var matter2 = $("#matter2");
    var n2 = nVals[matter2.options[matter2.selectedIndex].value];

    fgCtx.clearRect(0, 0, fg.width, fg.height);

    fgCtx.translate(orgX, orgY);

    // rotate for incident light
    fgCtx.rotate(d2r(rotatedAngle));

    // draw a pointer
    fgCtx.fillStyle = "white";
    fgCtx.fillRect(ptX, ptY, ptW, ptH);

    // draw a outline of a pointer
    fgCtx.strokeStyle = "black";
    fgCtx.strokeRect(ptX, ptY, ptW, ptH);

    fgCtx.lineWidth = 1;
    fgCtx.strokeStyle = "red";

    // draw an incident light
    if ($("#in-light").checked) {
      fgCtx.beginPath();

      fgCtx.moveTo(0, ptY + ptH / 2);
      fgCtx.lineTo(0, 0);

      fgCtx.stroke();

      // extended light
      if ($("#ext-light").checked) {
        fgCtx.beginPath();

        fgCtx.moveTo(0, 0);
        fgCtx.lineTo(0, -ptY - ptH / 2);

        fgCtx.setLineDash([5, 5]);
        fgCtx.stroke();
      
        fgCtx.setLineDash([]);
      }
    }

    // restore rotated angle
    fgCtx.rotate(-d2r(rotatedAngle));

    var sine = rotatedAngle > 90 
             ? n2 / n1 * Math.sin(d2r(180 - rotatedAngle))  // down to up
             : n1 / n2 * Math.sin(d2r(rotatedAngle));       // up to down
    var totalRefl = sine < -1 || sine > 1;
    var refracAngle;
    
    if(totalRefl)   // total reflection ?
      refracAngle = -rotatedAngle;
    else {
      refracAngle = r2d(Math.asin(sine));

      if (rotatedAngle > 90) // down to up ?
        refracAngle = -refracAngle;
      else                  // up to down ?
        refracAngle += 180;
    }

    // rotate for a refracted light 
    fgCtx.rotate(d2r(refracAngle));

    // draw a refracted light
    if ($("#refrac-light").checked) {
      fgCtx.beginPath();
      fgCtx.moveTo(0, ptY + ptH / 2);
      fgCtx.lineTo(0, 0);

      fgCtx.stroke();
    }

    // restore rotated angle
    fgCtx.rotate(-d2r(refracAngle));

    fgCtx.translate(-orgX, -orgY);    

    var fontSize = proR / 10;

    fgCtx.font = fontSize.toFixed(1) + "px sans-serif";
    fgCtx.fillStyle = "white";
    
    var angle = Math.round(Math.abs(rotatedAngle));
    // adjust angle into [0, 90]
    if (angle > 90)
      angle = Math.abs(180 - angle);

    // show incident angle
    if ($("#in-angle").checked)
      fgCtx.fillText("입사각: " + angle, 0, fontSize);

    angle = Math.round(Math.abs(refracAngle));
    // adjust angle into [0, 90]
    if (angle > 90)
      angle = Math.abs(180 - angle);
    // adjust angle into [0, 90] once more
    if (angle > 90)
      angle = Math.abs(180 - angle);

    // show refracted angle
    if ($("#refrac-angle").checked)
      fgCtx.fillText("굴절각: " + angle + (totalRefl ? "(전반사)" : ""), 
                     0, fontSize * 2);
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

      fgCtx.translate(orgX, orgY);
      fgCtx.rotate(d2r(rotatedAngle));

      fgCtx.beginPath();
      fgCtx.rect(ptX, ptY, ptW, ptH);

      // check if hitted
      if (fgCtx.isPointInPath(offsetX, offsetY)) {
        dragging = true;

        e.preventDefault();
      }

      fgCtx.rotate(-d2r(rotatedAngle));
      fgCtx.translate(-orgX, -orgY);
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

        // calc an new angle
        rotatedAngle = 90 + r2d(Math.atan2(offsetY - orgY, offsetX - orgX));
  
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
  ["#in-light", "#ext-light", "#refrac-light", 
   "#in-angle", "#refrac-angle",
   "#matter1", "#matter2"].forEach(function(id) {
    $(id).addEventListener("change", function() {
      if (id === "#matter1" || id === "#matter2")
        drawBackground();
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
