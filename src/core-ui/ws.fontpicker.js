

// @format

(function() {
  /** Font picker
     *
     *  Creates a small font picking widget editing of:
     *      - bold
     *      - font family
     *      - font size
     *      - color
     *
     *  Note that this must be attached to the document manually by appending
     *  the returned container to something.
     *
     *  @example
     *  var picker = ws.FontPicker(function (newStyle) {
     *      ws.dom.style(document.body, newStyle);
     *  });
     *
     *  ws.dom.ap(document.body, picker.container);
     *
     *  @param fn {function} - the function to call when things change
     *  @param style {object} - the current style object
     *    > fontFamily {string} - the font family
     *    > color {string} - the font color
     *    > fontWeight {string} - the current font weight
     *    > fontStyle {string} - the current font style
     *  @returns {object} - an interface to the picker
     *    > container {domnode} - the body of the picker
     */
  ws.FontPicker = function(fn, style) {
    var container = ws.dom.cr('div', 'ws-font-picker'),
      fontFamily = ws.DropDown(), //ws.dom.cr('select', 'font-family'),
      fontSize = ws.DropDown(null, 'ws-font-size'), //ws.dom.cr('select', 'font-size'),
      boldBtn = ws.PushButton(false, 'bold'),
      italicBtn = ws.PushButton(false, 'italic'),
      color = ws.dom.cr('span', 'font-color', '&nbsp;');

    if (ws.isStr(style)) {
      try {
        style = JSON.parse(style);
      } catch (e) {}
    }

    ///////////////////////////////////////////////////////////////////////

    function callback() {
      if (ws.isFn(fn)) {
        fn(style);
      }
    }

    function updateColor(ncol, suppressCallback) {
      ws.dom.style(color, {
        background: ncol
      });

      style.color = ncol;
      if (!suppressCallback) {
        callback();
      }
    }

    ///////////////////////////////////////////////////////////////////////

    /** Set the current options
         *  @memberof ws.FontPicker
         *  @param options {object} - the options to set
         */
    function set(options) {
      if (ws.isStr(options)) {
        try {
          options = JSON.parse(options);
        } catch (e) {
          ws.log(0, 'Error in FontPicker::set');
          return;
        }
      }

      style = ws.merge(
        {
          fontFamily: 'Default',//'"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
          color: '#333',
          fontSize: '18px',
          fontWeight: 'normal',
          fontStyle: 'normal'
        },
        options
      );

      //Set the current values
      boldBtn.set(style.fontWeight === 'bold');
      italicBtn.set(style.fontStyle === 'italic');
      updateColor(style.color, true);
      fontFamily.selectById(style.fontFamily);
      fontSize.selectById(style.fontSize.replace('px', ''));
    }

    //Add fonts to font selector
    fontFamily.addItems(ws.meta.fonts);
    //Add font sizes
    fontSize.addItems([8, 10, 12, 14, 16, 18, 20, 22, 25, 26, 28, 30, 32, 34]);

    set(style);

    //Listen to font changes
    fontFamily.on('Change', function(selected) {
      
      if (selected.id() === 'Default') style.fontFamily = '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif';
      else style.fontFamily = selected.id();

      return callback();
    });

    //Listen to font size changes
    fontSize.on('Change', function(selected) {
      style.fontSize = selected.id() + 'px';
      return callback();
    });

    //Listen to bold changes
    boldBtn.on('Toggle', function(state) {
      style.fontWeight = state ? 'bold' : 'normal';
      callback();
    });

    //Listen to italic changes
    italicBtn.on('Toggle', function(state) {
      style.fontStyle = state ? 'italic' : 'normal';
      callback();
    });

    //Handle color picker
    ws.dom.on(color, 'click', function(e) {
      ws.pickColor(e.clientX, e.clientY, style.color, updateColor);
    });

    //Create DOM
    ws.dom.ap(
      container,
      fontFamily.container,
        fontSize.container,
        ws.dom.ap(
          ws.dom.cr('div', 'ws-font-picker-buttons'),
          ws.dom.ap (
            ws.dom.cr('div', 'ws-font-style'),
            boldBtn.button,
            italicBtn.button
          ),
          color
      )
    );

    ///////////////////////////////////////////////////////////////////////

    return {
      set: set,
      container: container
    };
  };
})();
