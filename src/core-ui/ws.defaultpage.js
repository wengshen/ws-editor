

// @format

/* global window */

ws.DefaultPage = function(parent, options, chartPreview, chartFrame) {
  var events = ws.events(),
    // Main properties
    container = ws.dom.cr(
      'div',
      'ws-transition ws-toolbox ws-box-size'
    ),
    title = ws.dom.cr('div', 'ws-toolbox-body-title'),
    customizeTitle,
    contents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-inner-body'
    ),
    userContents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-user-contents ws-toolbox-defaultpage'
    ),
    width,
    chartWidth = '68%',
    iconClass,
    icon = ws.dom.cr('div', iconClass),
    // Data table
    iconsContainer = ws.dom.cr('div', 'ws-icons-container'),
    body = ws.dom.cr(
      'div',
      'ws-toolbox-body ws-box-size ws-transition'
    ),
    isVisible = false;
    
  function init() {
      
    width = options.widths.desktop;
    if (ws.onTablet() && options.widths.tablet) width = options.widths.tablet;
    else if (ws.onPhone() && options.widths.phone) width = options.widths.phone;

    customizeTitle = ws.dom.cr('div', 'ws-customize-title'/*, options.title*/),
    iconClass = 'ws-box-size ws-toolbox-bar-icon fa ' + options.icon;

    title.innerHTML = '';

    if (options.create && ws.isFn(options.create)) options.create(userContents, chartPreview, iconsContainer);

    ws.dom.ap(contents, /*ws.dom.ap(title,backIcon, customizeTitle, ws.dom.ap(iconsContainer,helpIcon)),*/ userContents);
    ws.dom.ap(body, contents);
  
    ws.dom.ap(parent, ws.dom.ap(container,body));

    expand();
    hide();
  }

  
  function afterResize(func){
    var timer;
    return function(event){
      if(timer) clearTimeout(timer);
      timer = setTimeout(func,100,event);
    };
  }

  function resize() {
    if (isVisible){
      expand()
      setTimeout(function() {
        resizeChart((((window.innerHeight
          || document.documentElement.clientHeight
          || document.body.clientHeight) - ws.dom.pos(body, true).y) - 16));
      }, 1000);
      //expand();
    }
  }
  
  if (!ws.onPhone()) {
    ws.dom.on(window, 'resize', afterResize(function(e){
      resize();
    }));
  }

  function getIcons() {
    return iconsContainer;
  }

  function expand() {
    
    var newWidth = width; //props.width;

    ws.dom.style(body, {
      width: 100 + '%',
      opacity: 1
    });

    if (!ws.onPhone()) {
      const windowWidth = ws.dom.size(parent).w;
      const percentage = ((100 - 68) / 100);
  
      
      var styles =  window.getComputedStyle(chartFrame);
      var containerStyles =  window.getComputedStyle(container);
      var chartMargin = parseFloat(styles['marginLeft']) + parseFloat(styles['marginRight']),
          containerMargin = parseFloat(containerStyles['marginLeft']) + parseFloat(containerStyles['marginRight']);

      ws.dom.style(container, {
        width: ((windowWidth*percentage) - (chartMargin + containerMargin + 35) - 3/*margin*/ /*padding*/) + 'px'
      });
    }
    events.emit('BeforeResize', newWidth);

    // expanded = true;

    function resizeBody() {
      var bsize = ws.dom.size(body),
        tsize = ws.dom.size(title),
        size = {
          w: bsize.w,
          h: (window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight) - ws.dom.pos(body, true).y
        };

        ws.dom.style(contents, {
          width: "100%",
          height: ((size.h - 16)) + 'px'
        });

        ws.dom.style(userContents, {
          width: size.w + 'px',
          height: ((size.h - 16)) + 'px'
        });

      //customizer.resize(newWidth, (size.h - 17) - tsize.h);

      return size;
    }

    setTimeout(resizeBody, 300);  
    ws.emit('UIAction', 'ToolboxNavigation', options.title);
  }

  function show() {
    ws.dom.style(container, {
      display: 'block'
    });
    
    expand();
    setTimeout(function() {
      resizeChart(((window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight) - ws.dom.pos(body, true).y) - 16);
    }, 200);

    isVisible = true;
  }
  
  function hide() {

    //customizer.showSimpleEditor();
    
    width = options.widths.desktop;
    if (ws.onTablet() && options.widths.tablet) width = options.widths.tablet;
    else if (ws.onPhone() && options.widths.phone) width = options.widths.phone;
    chartWidth = "68%";
    
    ws.dom.style(backIcon, {
      display: "none"
    });
    //searchAdvancedOptions.hide();

    expand();

    ws.dom.style(container, {
      display: 'none'
    });

    isVisible = false;
  }

  function destroy() {}

  chartPreview.on('ChartChange', function(newData) {
    events.emit('ChartChangedLately', newData);
  });


  //////////////////////////////////////////////////////////////////////////////

  /**
   * Resize the chart preview based on a given width
   */
  function resizeChart(newHeight) {
    ws.dom.style(chartFrame, {
      /*left: newWidth + 'px',*/
      width: chartWidth, //'68%',
      height: newHeight + 'px' || '100%'
    });
/*
    ws.dom.style(chartContainer, {
      width: psize.w - newWidth - 100 + 'px',
      height: psize.h - 100 + 'px'
    });*/

    setTimeout(chartPreview.resize, 200);
  }

  return {
    on: events.on,
    destroy: destroy,
    chart: chartPreview,
    hide: hide,
    show: show,
    resize: resize,
    isVisible: function() {
      return isVisible;
    },
    init: init,
    getIcons: getIcons
    //toolbar: toolbar
  };
};
