
//颜色选择器调色盘
// @format

(function() {
  var container = ws.dom.cr(
      'div',
      'ws-colorpicker ws-colorpicker-responsive'
    ),
    canvas = ws.dom.cr('canvas', 'picker'),
    closeBtn = ws.dom.cr('div', 'ws-ok-button', '关闭'),
    ctx = canvas.getContext('2d'),
    manualInput = ws.dom.cr('input', 'manual');//自定义输入区

  //Attach the container to the document when the document is ready
  ws.ready(function() {
    ws.dom.ap(document.body, container);
  });
  //更新手动区域getContrastedColor：取反色，黑白，为了字体和背景颜色显眼
  function updatePickerBackground(current) {
    ws.dom.style(manualInput, {
      background: current,
      color: ws.getContrastedColor(current)
    });
  }

  /** Color picker
     *  Component to pick colors from the google material design color palette.
     *  User input is also possible.
     *
     *  The color palette is defined in meta/ws.meta.colors.js,
     *  and is divided into groups of 14 hues per. color.
     *
     *  @example
     *  //Show a color picker at [10,10]
     *  ws.pickColor(10, 10, '#fff', function (color) {
     *      alert('You selected ' + color + ', great choice!');
     *  });
     *
     *  @param x {number} - the x position to display the picker at
     *  @param y {number} - the y position to display the picker at
     *  @param current {string} - the current color
     *  @param fn {function} - the function to call when the color changes
     *    > newColor {string} - the color selected by the user
     */
  ws.pickColor = function(x, y, current, fn) {
    var windowSize = ws.dom.size(document.body),
      containerSize = ws.dom.size(container),
      pickerSize = ws.dom.size(canvas),
      binder = false,
      pbinder = false,
      cbinder = false,
      dbinder = false;

    ///////////////////////////////////////////////////////////////////////

    /* Draws the color picker itself */
    function drawPicker() {
      //There's 14 hues per. color, 19 colors in total.  将生成一个14X19的颜色选择区域
      var x,
        y,
        tx = Math.floor(pickerSize.w / 14),    //每个小格的宽
        ty = Math.floor(pickerSize.h / 19),    //每个小格的高
        col = -1;

      canvas.width = pickerSize.w;
      canvas.height = pickerSize.h;

      //To avoid picking null   绘制大长方形
      ctx.fillStyle = '#FFF';
      ctx.fillRect(0, 0, pickerSize.w, pickerSize.h);
      //根据元数据，绘制每个小格
      for (y = 0; y < 19; y++) {
        for (x = 0; x < 15; x++) {
          ctx.fillStyle = ws.meta.colors[++col]; //ws.meta.colors[x + y * tx];
          ctx.fillRect(x * tx, y * ty, tx, ty);
        }
      }
    }

    /* Hide the picker */
    function hide() {
      ws.dom.style(container, {
        opacity: 0,
        left: '-20000px',
        'pointer-events': 'none'
      });
      binder();
      pbinder();
      cbinder();
      dbinder();
    }

    function rgbToHex(r, g, b) {
      var res = '#' + ((r << 16) | (g << 8) | b).toString(16);
      if (res.length === 5) {
        return res.replace('#', '#00');
      } else if (res.length === 6) {
        return res.replace('#', '#0');
      }
      return res;
    }

    function pickColor(e) {
      var px = e.clientX || e.touches[0].clientX || 0,
        py = e.clientY || e.touches[0].clientY || 0,
        cp = ws.dom.pos(canvas),
        id = ctx.getImageData(px - cp.x - x, py - cp.y - y, 1, 1).data,
        col = rgbToHex(id[0] || 0, id[1], id[2]);

      manualInput.value = col;

      updatePickerBackground(col);

      if (ws.isFn(fn)) {
        fn(col);
      }

      e.cancelBubble = true;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    ///////////////////////////////////////////////////////////////////////

    //Make sure we're not off screen
    if (x > windowSize.w - containerSize.w) {
      x = windowSize.w - containerSize.w - 10;
    }

    if (y > windowSize.h - containerSize.h) {
      y = windowSize.h - containerSize.h - 10;
    }

    ws.dom.style(container, {
      left: x + 'px',
      top: y + 'px',
      opacity: 1,
      'pointer-events': 'auto'
    });
    //显示遮罩层  点击遮罩层触发的函数, 点击遮罩层是否触发fn, 遮罩层是否透明, zIndex 返回一个可以隐藏遮罩层的函数
    dbinder = ws.showDimmer(hide, true, true, 5);
    //关闭触发隐藏
    cbinder = ws.dom.on(closeBtn, 'click', hide);
    //用户自定义颜色区keyup事件后触发
    binder = ws.dom.on(manualInput, 'keyup', function() {
      if (ws.isFn(fn)) {
        fn(manualInput.value);
      }
    });
    //触发选择颜色 值得关注的是ws.dom.on返回了一个解除事件的方法
    pbinder = ws.dom.on(canvas, ['mousedown', 'touchstart'], function(e) {
      var mover = ws.dom.on(canvas, ['mousemove', 'touchmove'], pickColor),
        cancel = ws.dom.on(
          document.body,
          ['mouseup', 'touchend'],
          function() {
            mover();
            cancel();
          }
        );

      pickColor(e);
    });

    manualInput.value = current;
    updatePickerBackground(current);

    drawPicker();

    ///////////////////////////////////////////////////////////////////////

    return {};
  };

  ws.dom.ap(container, canvas, manualInput, closeBtn);
})();
