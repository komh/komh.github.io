window.addEventListener("load", function(){
  // query selector helper
  $ = function(selector) {
    if (selector.charAt(0) === "#")
      return document.querySelector(selector);

    return document.querySelectorAll(selector);
  }

  var c = $("#canvas");
  var ctx = c.getContext("2d");

  // constructor of Circle object
  function Circle(x, y, r, color) {
    this._x = x ? x : 0; // x center of circle
    this._y = y ? y : 0; // y center of circle
    this._r = r ? r : 0; // radius of circle
    this._color = color ? color : "white"; // color of circle

    this._diffX = Infinity; // x difference between cetner and clicked point
    this._diffY = Infinity; // y difference between cetner and clicked point

    this.x = function(nx) {
      if (nx !== undefined) {
        // bound check
        if (nx < 0)
          nx = 0;
        if (nx > c.width)
          nx = c.width;

        this._x = nx;
      }

      return this._x;
    };

    this.y = function(ny) {
      if (ny !== undefined) {
        // bound check
        if (ny < 0)
          ny = 0;
        if (ny > c.height)
          ny = c.height;

        this._y = ny;
      }

      return this._y;
    };

    this.r = function(nr) {
      if (nr != undefined)
        this._r = nr;

      return this._r;
    };

    this.color = function(ncolor) {
      if (ncolor != undefined)
        this._color = ncolor;

      return this._color;
    };

    this.diffX = function(ndiffX) {
      if (ndiffX != undefined)
        this._diffX = ndiffX;

      return this._diffX;
    };

    this.diffY = function(ndiffY) {
      if (ndiffY != undefined)
        this._diffY = ndiffY;

      return this._diffY;
    };

    this.draw = function() {
      const savedOp = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "lighter";

      ctx.beginPath();
      ctx.arc(this._x, this._y, this._r, 0, 2 * Math.PI);
      ctx.fillStyle = this._color;
      ctx.fill();

      ctx.globalCompositeOperation = savedOp;
    };

    this.isIn = function(x, y) {
      const diffX = x - this._x;
      const diffY = y - this._y;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);

      if (distance < this._r) {
        this.diffX(diffX);
        this.diffY(diffY);

        return true;
      }

      return false;
    };
  }

  var circles = [];
  var dragging = undefined;
  var prevWidth = undefined;
  var prevHeight = undefined;

  function reset() {
    c.width = window.innerWidth * 2 / 3;
    c.height = window.innerHeight * 2 / 3;

    // generate colored circles
    if (circles.length == 0) {
      ["#ff0000", "#00ff00", "#0000ff",
       "#d0d000", "#00d0d0", "#d000d0"].forEach(function(color, index) {
        circles.push(new Circle(c.width * (index % 3) / 2,
                                c.height * parseInt(index / 3),
                                c.width / 10, color));
      });
    }

    if (prevWidth === undefined)
      prevWidth = c.width;
    if (prevHeight === undefined)
      prevHeight = c.height;

    // scale and bound check
    circles.forEach(function(circle, index) {
      circle.x(circle.x() / prevWidth * c.width);
      circle.y(circle.y() / prevHeight * c.height);
      circle.r(circle.r() / prevWidth * c.width);
      circle.diffX(circle.diffX() / prevWidth * c.width);
      circle.diffY(circle.diffY() / prevHeight * c.height);
    });

    prevWidth = c.width;
    prevHeight = c.height;
  }

  // clear background
  function clearBackground() {
    ctx.clearRect(0, 0, c.width, c.height);
  }

  // update image
  function update() {
    clearBackground();

    circles.forEach(function(circle) { circle.draw(); });
  }

  reset();
  update();

  // mousedown event and touchstart event listener
  ["mousedown", "touchstart"].forEach(function(ev) {
    c.addEventListener(ev, function(e) {
      var offsetX = 0, offsetY = 0;
  
      if (e.touches) {
        // touchstart event
        var rect = c.getBoundingClientRect();

        offsetX = e.touches[0].clientX - rect.left;
        offsetY = e.touches[0].clientY - rect.top;
      } else {
        // mousedown event
        offsetX = e.offsetX;
        offsetY = e.offsetY;
      }

      // check if in circle
      for (var i = 0; i < circles.length; i++) {
        if (circles[i].isIn(offsetX, offsetY)) {
          // store clicked circle to use later
          dragging = circles[i];
          
          // clicked circle first
          circles.unshift(circles.splice(i, 1)[0]);

          // do not propagate this event
          e.preventDefault();
          break;
        }
      }
    });
  });

  // mousemove event and touchmove event listener
  // This should be added to window because mousemove does not occur
  // if mouse moves outside canvas.
  ["mousemove", "touchmove"].forEach(function(ev) {
    window.addEventListener(ev, function(e) {
      if (dragging !== undefined) {
        var clientX = 0, clientY = 0;

        if (e.touches) {
          // touchmove event
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          // mousemove event
          clientX = e.clientX;
          clientY = e.clientY;
        }

        var rect = c.getBoundingClientRect();
 
        // move circle relative to the point when mouse dragging started
        dragging.x(clientX - rect.left - dragging.diffX());
        dragging.y(clientY - rect.top - dragging.diffY());

        update();

        // do not propagate this event
        e.preventDefault();
      }
    });
  });

  // mouseup event and touchend event listener
  // This should be added to window because mouseup event does not occur
  // if mouse button is released outside of canvas.
  ["mouseup", "touchend"].forEach(function(ev) {
    window.addEventListener(ev, function(e) {
      // clear dragging status
      if (dragging !== undefined) {
        dragging = undefined;

        // do not propagate this event
        e.preventDefault();
      }
    });
  });

  // resize event listener
  window.addEventListener("resize", function() { reset(); update(); });
});
