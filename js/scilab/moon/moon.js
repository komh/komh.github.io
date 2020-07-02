// query selector 편의 함수
function $(selector) {
  if (selector.charAt(0) === "#")
    return document.querySelector(selector);

  return document.querySelectorAll(selector);
}

function clearBackground(c, ctx) 
{
  // 배경 지우기
  ctx.clearRect(0, 0, c.width, c.height);
}

function drawSun(c, ctx, ex, ey, er) 
{
  const side = $("input[name='sun']:checked")[0].value;

  var sx = 0;
  var sy = 0;
  var sr = er;
  var distance = er * 6;

  switch (side) {
    case "south":
      sx = 0;
      sy = -distance;
      break;

    case "north":
      sx = 0;
      sy = distance;
      break;

    case "east":
      sx = -distance;
      sy = 0;
      break;

    case "west":
    default:
      sx = distance;
      sy = 0;
      break;
  }

  ctx.save();

  // 지구 원점
  ctx.translate(ex, ey);

  // 태양 전체
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();

  // 태양 둘레
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, 2 * Math.PI);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.stroke();

  var savedOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = "destination-over";

  // 태양까지 보조선
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(sx, sy);
  ctx.lineWidth = 1;
  ctx.setLineDash([5]);
  ctx.strokeStyle = "white";
  ctx.stroke();

  ctx.globalCompositeOperation = savedOp;

  ctx.restore();
}

function drawEarth(c, ctx, x, y, r) 
{
  // 지구 전체
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = "green";
  ctx.fill();

  // 지구 둘레
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.stroke();
}

function drawMoon(c, ctx, ex, ey, mx, my, mr, lday) 
{
  var moonEarthSide = $("#moon-earth");
  var moonSunSide = $("#moon-sun");
  var moonSeeingSide = $("#moon-seeing");

  ctx.save();

  // 지구 원점
  ctx.translate(ex, ey);

  // 월령 효과
  var rotateAngle = lday == 30 ? 0 : 2 * Math.PI * (lday / 30);
  ctx.rotate(-rotateAngle);

  // 지구쪽 ?
  if (moonEarthSide.checked) {
    // 지구에서 보이는 면
    ctx.beginPath();
    ctx.arc(mx, my, mr, Math.PI / 2, -Math.PI / 2);
    ctx.fillStyle = "green";
    ctx.fill();
  }

  // 태양쪽?
  if (moonSunSide.checked) {
    ctx.save();

    // 달 원점
    ctx.translate(mx, my);

    // 월령 효과 제거
    ctx.rotate(rotateAngle);

    // 태양빛을 받는 면
    ctx.beginPath();
    ctx.arc(0, 0, mr, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = "red";
    ctx.fill();

    // 태양빛을 받는 면의 경계선
    ctx.beginPath();
    ctx.moveTo(0, -mr);
    ctx.lineTo(0, +mr);
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.restore();
  }

  // 지구쪽?
  if (moonEarthSide.checked) {
    // 지구에서 보이는 면의 경계선
    ctx.beginPath();
    ctx.moveTo(mx, my - mr);
    ctx.lineTo(mx, my + mr);
    ctx.strokeStyle = "white";
    ctx.stroke();
  }

  // 보이는 쪽?
  if (moonSeeingSide.checked) {
    var startAngle = Math.PI / 2;
    var endAngle = Math.PI / 2 + rotateAngle;

    // 보름달 이후?
    if (rotateAngle > Math.PI) {
      startAngle = -Math.PI / 2 + rotateAngle;
      endAngle = -Math.PI / 2;
    }

    // 실제로 보이는 면
    ctx.beginPath();
    ctx.arc(mx, my, mr, startAngle, endAngle);
    ctx.lineTo(mx, my);
    ctx.fillStyle = "yellow";
    ctx.fill();
  }

  // 달 둘레
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, 2 * Math.PI);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.stroke();

  var savedOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = "destination-over";

  // 달까지 보조선
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(mx, my);
  ctx.lineWidth = 1;
  ctx.setLineDash([5]);
  ctx.strokeStyle = "white";
  ctx.stroke();

  ctx.globalCompositeOperation = savedOp;

  ctx.restore();
}

function drawMoonPhase(c, ctx, mr, lday) 
{
  const margin = 15;
  const x = c.width - mr - margin;
  const y = mr + margin;

  if ($("#moon-phase").checked) {
    // 달 전체: 보름 또는 그믐
    ctx.beginPath();
    ctx.arc(x, y, mr, 0, 2 * Math.PI);
    ctx.fillStyle = lday >= 15 && lday != 30 ? "yellow" : "black";
    ctx.fill();

    // 보름, 그믐 제외
    if (lday % 15 != 0) {
      var fillStyle = "yellow";
      // 보름 이후?
      if (lday > 15) {
        fillStyle = "black";
        lday -= 15;
      }

      // 위상 오른쪽 경계
      ctx.beginPath();
      ctx.arc(x, y, mr, -Math.PI / 2, Math.PI / 2);

      // 위상 왼쪽 경계
      const n = 20;
      for (var i = 1; i < n; i++) {
        const x2 = x + mr * Math.sin(Math.PI / 180 * (180 / n) * i) /
                       7.5 * (7.5 - lday);
        const y2 = y + mr * Math.cos(Math.PI / 180 * (180 / n) * i);
        ctx.lineTo(x2, y2);
      }

      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
  }

  // 달 둘레
  ctx.beginPath();
  ctx.arc(x, y, mr, 0, 2 * Math.PI);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.stroke();
}

function drawHorizon(c, ctx, ex, ey) 
{
  var savedOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = "destination-over";

  const width = 3;

  // 지평선
  ctx.beginPath();
  ctx.moveTo(0, ey);
  ctx.lineTo(c.width, ey);
  ctx.lineWidth = width;
  ctx.strokeStyle = "white";
  ctx.stroke();

  ctx.globalCompositeOperation = savedOp;  

  const fontSize = 24;

  // 동-서 표시
  ctx.font = fontSize + "px" + " monospace";
  ctx.fillStyle = "white";
  ctx.fillText("동", 0, ey - width);
  ctx.fillText("서", c.width - fontSize, ey - width);
}

function padBlank(str, length)
{
  var i = length - str.length;
  for (var i = length - str.length; i > 0; i--)
    str = "&nbsp;" + str;

  return str;
}

window.addEventListener("load", function() {
  var c = $("#moon-canvas");
  var ctx = c.getContext("2d");

  // 캔버스 중심
  var xMid = 0;
  var yMid = 0;

  // 지구 중심, 반지름
  var ex = 0;
  var ey = 0;
  var er = 0;

  // 달 중심, 반지름
  var mx = 0;
  var my = 0;
  var mr = 0;

  var lunarDay = $("#lunar-day");
  var rotation = $("#rotation");

  var reset = function() {
    c.width = window.innerWidth * 2 / 3;
    c.height = window.innerHeight * 3 / 5;

    xMid = c.width / 2;
    yMid = c.height / 2;

    ex = 0;
    ey = 0;
    er = c.width / 35;

    mx = er * 3;
    my = 0;
    mr = er * 1.5;
  }

  var update = function() {
    var lunarDayLabel = $("#lunar-day-label");

    // 월령 레이블 업데이트
    lunarDayLabel.innerHTML = padBlank(Number(lunarDay.value).toFixed(1), 4) +
                              " 일"

    var rotationLabel = $("#rotation-label");

    // + 부호 붙이기
    var hours = Number(rotation.value).toFixed(1);
    if (hours >= 0)
      hours = "+" + hours;

    // 자전 레이블 업데이트
    rotationLabel.innerHTML = padBlank(hours, 5) + " 시간";

    clearBackground(c, ctx);

    ctx.save();
 
    // 캔버스 중심 원점
    ctx.translate(xMid, yMid);

    // 자전 효과
    ctx.rotate(2 * Math.PI / 24 * rotation.value);

    drawSun(c, ctx, ex, ey, er);

    const sun = $("input[name='sun']:checked")[0].value;
    
    // 태양 초기 위치에 따른 시간
    var baseTime = sun == "south" ? 12 :
                   sun == "east" ? 6 :
                   sun == "north" ? 0 : 18;

    var timeLabel = $("#time-label");
    var currentTime = baseTime + parseFloat(rotation.value);
    
    // 현재 시간을 24시 형식으로 변환
    while (currentTime < 0)
      currentTime += 24;
    while (currentTime >= 24)
      currentTime -= 24;

    // 현재 시간 레이블 업데이트
    timeLabel.innerHTML = padBlank(currentTime.toFixed(1), 5) + " 시";

    // 태양 위치 효과
    ctx.rotate(Math.PI / 2 * ((baseTime - 18) / 6));

    drawEarth(c, ctx, ex, ey, er);
    drawMoon(c, ctx, ex, ey, mx, my, mr, lunarDay.value);

    ctx.restore();

    drawHorizon(c, ctx, xMid + ex, yMid + ey);

    drawMoonPhase(c, ctx, mr, lunarDay.value);
  };

  reset();
  update();

  // 슬라이더 이벤트 리스너
  [lunarDay, rotation].forEach(function(e) {
    ["change"/*IE*/, "input"/*FF*/].forEach(function(ev) {
      e.addEventListener(ev, function() {
        update();
      });
    });
  });

  // 클릭 이벤트 리스너
  [$("input[name='sun']"),
   $(".moon")].forEach(function(l, idx) {
    Array.prototype.forEach.call(l, function(e) {
      e.addEventListener("click", function() { 
        update();
      });
    });
  });

  // 마우스 버튼 눌림 상태
  var pressed = {
    id: undefined,      // 버튼 요소 id
    timer: undefined,   // 타이머 id
    repeated: false     // 누름 반복 여부
  };

  function checkPress(once) {
    if (pressed["lunar-day-up"])
      lunarDay.stepUp();
    else if (pressed["lunar-day-down"])
      lunarDay.stepDown();
    else if (pressed["rotation-up"])
      rotation.stepUp();
    else if (pressed["rotation-down"])
      rotation.stepDown();

    pressed.repeated = true;

    update();

    if (!once) {
      // 계속 누를 때
      pressed.timer = setTimeout(checkPress, 100);
    }
  }

  // 버튼 누르기 이벤트 리스너
  [$("#lunar-day-up"), $("#lunar-day-down"),
   $("#rotation-up"), $("#rotation-down")].forEach(function(elm) {
    ["mousedown", "touchstart"].forEach(function(ev) {
      elm.addEventListener(ev, function(event) {
        pressed.id = event.target.id;
        pressed[pressed.id] = true;

        // 처음 누를 때
        pressed.timer = setTimeout(checkPress, 150);

        event.preventDefault();
      });
    });
  });

  // 버튼 떼기 이벤트 리스너
  ["mouseup", "touchend"].forEach(function(ev) {
    window.addEventListener(ev, function(event) {
      if (pressed.id !== undefined) {
        clearTimeout(pressed.timer);

        // 한 번만 눌렀을면 클릭 처리
        if (!pressed.repeated)
          checkPress(true);

        pressed[pressed.id] = false;

        pressed.id = undefined;
        pressed.timer = undefined;
        pressed.repeated = false;

        event.preventDefault();
      }
    });
  });

  // 크기 변경 이벤트 리스너
  window.addEventListener("resize", function() { reset(); update(); });
});
