window.addEventListener("load", function() {
  function $(selector) {
    if (selector.charAt(0) === "#")
      return document.querySelector(selector);
    
    return document.querySelectorAll(selector);
  };

  var area = $("#canvas-area");
  var bg = $("#canvas-bg");
  var fg = $("#canvas-fg");

  var bgCtx = bg.getContext("2d");
  var fgCtx = fg.getContext("2d");

  // initial P, V of air
  const P0 = 1, V0 = 4

  //  P, V of air in equilibrium
  var Peq = P0, Veq = V0;

  // P, V of air in new equilibrium
  var Pnew = P0, Vnew = V0;

  // number of tick
  const nTicks = 4;

  // wall geometry
  var wallX = 0, wallY = 0;
  var wallW = 0, wallH = 0;
  var wallThick = 0;

  // position of piston relative to wallY
  var piston = 0;

  // max position of piston relative to wallY
  var maxPiston = undefined;

  // average velocity of particles
  var avgVelocityX = 7;
  var avgVelocityY = 7;

  // initial number of particles
  const N0 = 10;

  // particles
  var particles = undefined;

  // standard particles for pressure measure
  var stdParticles = undefined;

  // time for statistics
  var startTime = undefined;
  var currentTime = undefined;

  // collisions of particles
  var statHoriz = 0;
  var statVert = 0;

  // collisions of standard particles
  var stdStatHoriz = 0;
  var stdStatVert = 0;

  // for animation
  var aniId = undefined;

  // for dragging
  var dragging = false;
  var diffY = 0;

  // for scaling
  var prevW = undefined;
  var prevH = undefined;

  // constructor of Particle
  function Particle(x, y, r, vx, vy) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.vx = vx;
    this.vy = vy;
  }

  // draw a particle
  Particle.prototype.draw = function() {
    fgCtx.beginPath();
    fgCtx.arc(wallX + this.x, wallY + this.y, this.r, 0, 2 * Math.PI);
    fgCtx.fillStyle = "white";
    fgCtx.fill();
  };

  function resetStats() {
    //  statistics
    startTime = currentTime = undefined;
    stdStatHoriz = stdStatVert = statHoriz = statVert = 0;
  }

  // generate particles
  function genParticles(n) {
    var newParticles = [];
    var i = n;

    // generate a particle with average velocity
    if (i % 2 === 1) {
      newParticles.push(new Particle(
        Math.random() * wallW, Math.random() * wallH, wallThick / 2, 
        avgVelocityX, avgVelocityY));
 
      i--;
    }

   // generate a pair of particles with average velocity
    while (i > 0) {
      var diffVX = avgVelocityX / 2 * Math.random();
      var diffVY = avgVelocityY / 2 * Math.random();

      newParticles.push(new Particle(
        Math.random() * wallW, Math.random() * wallH, wallThick / 2, 
        (avgVelocityX + diffVX) * (Math.random() < 0.5 ? 1 : -1), 
        (avgVelocityY + diffVY) * (Math.random() < 0.5 ? 1 : -1)));

      newParticles.push(new Particle(
        Math.random() * wallW, Math.random() * wallH, wallThick / 2, 
        (avgVelocityX - diffVX) * (Math.random() < 0.5 ? 1 : -1), 
        (avgVelocityY - diffVY) * (Math.random() < 0.5 ? 1 : -1)));
      
      i -= 2;
    }

    return newParticles;
  }

  // reset variables in according to a window size
  function reset() {
    bg.width = fg.width = window.innerWidth;
    bg.height = fg.height = window.innerHeight * 8.5 / 10;

    // adjust height of a container
    area.style.height = fg.height + "px";

    // geometry of wall
    wallW = bg.width / 5;
    wallH = bg.height / 1.5;
    wallX = (bg.width - wallW) / 2;
    wallY = (bg.height - wallH) / 2;
    wallThick = wallW / 20;

    // generate particles    
    if (particles === undefined) {
      particles = genParticles(N0);
      stdParticles = genParticles(N0);
    }

    if (prevW === undefined) {
      prevW = wallW;
      prevH = wallH;
    }

    // scaling on resize
    particles.forEach(function(p) {
      p.x = p.x / prevW * wallW;
      p.y = p.y / prevH * wallH;
      p.r = wallThick / 2;
      p.vx = p.vx / prevW * wallW;
      p.vy = p.vy / prevH * wallH; 
    });

    stdParticles.forEach(function(p) {
      p.x = p.x / prevW * wallW;
      p.y = p.y / prevH * wallH;
      p.r = wallThick / 2;
      p.vx = p.vx / prevW * wallW;
      p.vy = p.vy / prevH * wallH; 
    });

    avgVelocityX = avgVelocityX / prevW * wallW;
    avgVelocityY = avgVelocityY / prevH * wallH;

    piston = piston / prevH * wallH;

    maxPiston = wallH * 3 / nTicks

    prevW = wallW;
    prevH = wallH;
  }

  // draw background
  function drawBackground() {
    bgCtx.clearRect(0, 0, bg.width, bg.height);

    // border
    bgCtx.fillStyle = "white";
    bgCtx.fillRect(wallX - wallThick, wallY - wallThick, 
                   wallW + wallThick * 2, wallH + wallThick * 2);

    // inner area
    bgCtx.fillStyle = "black";
    bgCtx.fillRect(wallX, wallY, wallW, wallH);

    // ticks
    bgCtx.fillStyle = "blue";
    for (var h = 1; h < nTicks; h++) {
      bgCtx.fillRect(wallX - wallThick, wallY - wallThick + wallH / nTicks * h, 
                     wallThick, wallThick);
      bgCtx.fillRect(wallX + wallW, wallY - wallThick + wallH / nTicks * h,  
                     wallThick, wallThick);
    }
  }

  // calculate volume of air
  function calcVolume() {
    return V0 * (1 - piston / wallH);
  }

  // calculate internal pressure of air
  function calcInPressure() {
    return statVert / stdStatVert;
  }

  // calculate external pressure of air
  function calcExPressure() {
    // piston gone away ?
    if (Vnew > V0) {
        return calcInPressure();
    }

    return parseInt($("input[name='ex-pressure']:checked")[0].value);
  }

  // return number except NaN and Infinity
  function numStr(n) {
    if (isNaN(n) || !isFinite(n))
      return "";

    return n;
  }

  // draw foreground
  function drawForeground() {
    fgCtx.clearRect(0, 0, fg.width, fg.height);

    // piston
    // piston shown ?
    if (Vnew <= V0) {
      fgCtx.fillStyle = "yellow";
      fgCtx.fillRect(wallX, wallY + piston - wallThick, wallW, wallThick);
    }

    // draw particles
    particles.forEach(function(p) {
      p.draw();
    });

    // show statistics
    var fontSize = wallH / 15;
    var x = wallX + wallW + fontSize * 1.5;
    var y = wallY;

    fgCtx.font = fontSize.toFixed(1) + "px sans-serif";

    fgCtx.fillStyle = "white";

    fgCtx.fillText("외압: " + numStr(calcExPressure().toFixed(1)), x, y);

    y += fontSize;
    fgCtx.fillText("부피: " + calcVolume().toFixed(1), x, y);

    y += fontSize;
    fgCtx.fillText("속력: " + $("input[name='temp']:checked")[0].value *
                              $("input[name='velocity']:checked")[0].value,
                   x, y);

    y += fontSize;
    fgCtx.fillText("충돌: " + 
                    numStr(Math.round(statVert /  (currentTime - startTime) 
                      * 1000)), 
                    x, y);

    y += fontSize;
    fgCtx.fillText("내압: " + numStr(calcInPressure().toFixed(1)), x, y);
  }

  var doReset = false;

  // update particles
  function update(ms) {
    if (startTime === undefined)
      startTime = ms;
 
    currentTime = ms;

    var times = $("input[name='temp']:checked")[0].value *
                $("input[name='velocity']:checked")[0].value;

    // move particles
    particles.forEach(function(p) {
      p.x += p.vx * times;
      p.y += p.vy * times;

      if (p.x < 0 || p.x >= wallW) { // collides with horizontal boundary ?
        statHoriz++;

        p.vx = -p.vx;

        if (p.x < 0)
          p.x = -p.x;
        else if (p.x >= wallW)
          p.x = (wallW - 1) * 2 - p.x;
      }

      if (p.y < piston || p.y >= wallH) { // collides with vertical boundary ?
        statVert++;

        p.vy = -p.vy;

        if (p.y < piston)
          p.y = piston * 2 - p.y;
        else if (p.y >= wallH)
          p.y = (wallH - 1 ) * 2 - p.y;
      }
    });

    // move standard particles
    stdParticles.forEach(function(p) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 && p.x >= wallW) { // collides with horizontal bounday ?
        stdStatHoriz++;

        p.vx = -p.vx;

        if (p.x < 0)
          p.x = -p.x;
        else if (p.x >= wallW) 
          p.x = (wallW - 1) * 2 - p.x;
      }

      if (p.y < 0 || p.y >= wallH) { // collides with vertical boundary ?
        stdStatVert++;
        
        p.vy = -p.vy;

        if (p.y < 0)
          p.y = -p.y;
        else if (p.y >= wallH)
          p.y = (wallH - 1) * 2 - p.y;
      }
    });

    var newPiston = (V0 - Vnew) * wallH / nTicks;

    if (Math.abs(newPiston - piston) >= 1) {
      piston += (newPiston - piston) / 10;
      doReset = true;
    } else {
      piston = newPiston;
      Peq = Peq * Veq / Vnew;
      Veq = Vnew;

      if (doReset)
        resetStats();

      doReset = false;
    }
 
    if (piston < 0)
      piston = 0;
    else if (piston >= maxPiston)
      piston = maxPiston;

    particles.forEach(function(p) {
      if (p.y < piston)
        p.y = piston;
    });      

    drawForeground();

    // request next animation
    aniId = window.requestAnimationFrame(update);
  }

  // disable radio buttons
  function disableRadios(disabled) {
    [$("input[name='ex-pressure']"), $("input[name='temp']"),
     $("input[name='particles']"), $("input[name='velocity']")]
    .forEach(function(l) {
      [].forEach.call(l, function(elm) {
        elm.disabled = disabled;
      });
    });
  }

  // initializes controls for browsers such as FireFox which do not clears 
  // checked state after refresh
  $("#movement").checked = false;
  $("input[name='ex-pressure']")[0].checked = true;
  $("input[name='temp']")[0].checked = true;
  $("input[name='particles']")[0].checked = true;
  $("input[name='velocity']")[0].checked = true;

  // disable radio buttons at first
  disableRadios(true);

  reset();
  drawBackground();
  drawForeground();

  // register event listener for change event
  $("#movement").addEventListener("change", function(event) {
    disableRadios(!event.target.checked);

    if (event.target.checked) {
      resetStats();
      aniId = window.requestAnimationFrame(update);
    } else
      window.cancelAnimationFrame(aniId);
  });

  // current value of external pressure
  var EPval = 1;

  // register event listener for change event
  [].forEach.call($("input[name='ex-pressure']"), function(elm) {
    elm.addEventListener("change", function() {
      Pnew = Peq * Veq / Vnew;
      Vnew = Pnew * Vnew / (Pnew * (elm.value / EPval));

      EPval =  elm.value;

      resetStats();

      drawForeground();
    });
  });

  // current value of temperature
  var Tval = 1;

  // register event listener for change event
  [].forEach.call($("input[name='temp']"), function(elm) {
    elm.addEventListener("change", function() {
      Pnew = Peq * Veq / Vnew;
      Vnew = Pnew * (elm.value / Tval) * Vnew / Pnew;

      Tval = elm.value;

      resetStats();
    });
  });

  // current value of particles
  var Nval = 1;

  // register event listener for change event
  [].forEach.call($("input[name='particles']"), function(elm) {
    elm.addEventListener("change", function() {
      Pnew = Peq * Veq / Vnew;
      Vnew = Pnew * (elm.value / Nval) * Vnew / Pnew;

      Nval = elm.value;

      particles = genParticles(N0 * Nval);

      resetStats();
    });
  });

  // current value of velocity
  var Vval = 1;

  // register event listener for change event
  [].forEach.call($("input[name='velocity']"), function(elm) {
    elm.addEventListener("change", function() {
      Pnew = Peq * Veq / Vnew;
      Vnew = Pnew * (elm.value / Vval) * Vnew / Pnew;

      Vval = elm.value;

      resetStats();
    });
  });

  // register event listener for resize event
  window.addEventListener("resize", function() {
    reset();
    drawBackground();
    drawForeground();
  });
});
