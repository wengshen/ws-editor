

// @format

/* global window */

ws.TemplatePage = function(parent, options, chartPreview, chartFrame, props) {
  var events = ws.events(),
    // Main properties
    properties = ws.merge(
      {
        defaultChartOptions: {},
        useHeader: true,
        features: [
          'data',
          'templates',
          'customize',
          'customcode',
          'advanced',
          'export'
        ],
        importer: {},
        dataGrid: {},
        customizer: {},
        toolbarIcons: []
      },
      options
    ),
      //整体容器
    container = ws.dom.cr(
      'div',
      'ws-transition ws-toolbox ws-box-size'
    ),
    title, // = ws.dom.cr('div', 'ws-toolbox-body-title', props.title),
    //左部内容
      contents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-inner-body'
    ),
    userContents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-user-contents ws-toolbox-defaultpage ws-toolbox-templatepage'
    ),
    helpIcon = ws.dom.cr(
      'div',
      'ws-toolbox-help ws-icon fa fa-question-circle'
    ),
    iconClass,
    icon = ws.dom.cr('div', iconClass),
    helpModal,
    // Data table
    templatesContainer = ws.dom.cr('div', 'ws-box-size ws-fill'),
    templates,
    /*customizer = ws.ChartCustomizer(
      customizerContainer,
      properties.customizer,
      chartPreview
    ),*/
    body = ws.dom.cr(
      'div',
      'ws-toolbox-body ws-box-size ws-transition'
    ), 
    iconsContainer = ws.dom.cr('div', 'ws-toolbox-icons'),
    isVisible = false;

  //customizer.on('PropertyChange', chartPreview.options.set);
  //customizer.on('PropertySetChange', chartPreview.options.setAll);
  
  function init() {
    title = ws.dom.cr('div', 'ws-toolbox-body-title'/*, props.title*/);
    iconClass = 'ws-box-size ws-toolbox-bar-icon fa ' + props.icon;

    templatesContainer.innerHTML = '';
    templates = ws.ChartTemplateSelector(templatesContainer, chartPreview);
    helpModal = ws.HelpModal(props.help || []);

    templates.on('Select', function(template) {
      //chartPreview.loadTemplate(template);
      events.emit('TemplateChanged', template);
    });

    templates.on('LoadDataSet', function(sample) {
      if (sample.type === 'csv') {
        if (ws.isArr(sample.dataset)) {
          chartPreview.data.csv(sample.dataset.join('\n'));
        } else {
          chartPreview.data.csv(sample.dataset);
        }
  
        chartPreview.options.set('subtitle-text', '');
        chartPreview.options.set('title-text', sample.title);
      }
    });
  
    contents.innerHTML = '';

    ws.dom.ap(userContents, templatesContainer);
    ws.dom.ap(contents, /*ws.dom.ap(title, ws.dom.ap(iconsContainer, helpIcon)),*/ userContents);
    ws.dom.ap(body, contents);
    ws.dom.ap(parent, ws.dom.ap(container,body));
    templates.resize();
  
    expand();
    hide();
  }

  function selectSeriesTemplate(index, projectData) {
    templates.selectSeriesTemplate(index, projectData);
  }

  function createTemplates(container, titleHeader, options, setLoading, toNextPage) {
    
    const headerBar = ws.dom.cr('div', 'ws-template-header', titleHeader),
          templatesContainer = ws.dom.cr('div', 'ws-templates-container');

          ws.dom.ap(container, ws.dom.ap(ws.dom.cr('div', 'ws-toolbox-template-container'), headerBar, templatesContainer));
          
    if (options.id) options = ws.templates.getAllInCat(options.id);

    Object.keys(options).forEach(function(key) { 
      const templateContainer = ws.dom.cr('div', 'ws-template-container'),
            preview = ws.dom.cr('div', 'ws-chart-template-thumbnail');

      const t = options[key];

      if (ws.meta.images && ws.meta.images[t.thumbnail]) {
        ws.dom.style(preview, {
          'background-image':
            'url("data:image/svg+xml;utf8,' +
            ws.meta.images[t.thumbnail] +
            '")'
        });
      } else {
        ws.dom.style(preview, {
          'background-image':
            'url(' + ws.option('thumbnailURL') + t.thumbnail + ')'
        });
      }

      ws.dom.on(templateContainer, 'click', function() {
        setLoading(true);
        setTimeout(function() {
          t.header =  t.parent;
          events.emit('TemplateChanged', ws.merge({}, t), true, function() {
            setLoading(false);
            toNextPage();
          });
        }, 1000);
      });

      ws.dom.ap(templatesContainer, ws.dom.ap(templateContainer, preview, ws.dom.cr('div', 'ws-template-title', t.title)));

    });
    
  }

  function createMostPopularTemplates(toNextPage, setLoading) {
    const templates = ws.templates.getCatArray();
    const container = ws.dom.cr('div', 'ws-toolbox-templates-container');
    
    const mostPopular = ws.templates.getMostPopular();

    createTemplates(container, 'Most Popular', mostPopular, setLoading, toNextPage);
    
    Object.keys(templates).forEach(function(key) {
      const t = templates[key];

      createTemplates(container, t.id, t, setLoading, toNextPage);

    });

    return container;
  }

  function getIcons() {
    return null;
  }

  function resize() {
    if (isVisible){

      expand()
      setTimeout(function() {
        resizeChart((((window.innerHeight
          || document.documentElement.clientHeight
          || document.body.clientHeight) - ws.dom.pos(body, true).y) - 16));
      });
    }
  }

  if (!ws.onPhone()) {
    ws.dom.on(window, 'resize', afterResize(function(e){
      resize();
    }));
  }

  function afterResize(func){
    var timer;
    return function(event){
      if(timer) clearTimeout(timer);
      timer = setTimeout(func,100,event);
    };
  }

  function expand() {
      
    var newWidth = props.widths.desktop;
    if (ws.onTablet() && props.widths.tablet) newWidth = props.widths.tablet;
    else if (ws.onPhone() && props.widths.phone) newWidth = props.widths.phone;

    ws.dom.style(body, {
      width: 100 + '%',
      opacity: 1
    });
/*
    ws.dom.style(container, {
      width: newWidth + '%'
    });
*/




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
          height: ((size.h - 16) - 47) + 'px'
        });
        
      templates.resize(newWidth, (size.h - 17) - tsize.h);   

      return size;
    }

    setTimeout(resizeBody, 300);  
    ws.emit('UIAction', 'ToolboxNavigation', props.title);
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
    ws.dom.style(container, {
      display: 'none'
    });
    isVisible = false
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
      width: '68%',
      height: newHeight + 'px'
    });

    setTimeout(chartPreview.resize, 200);
  }

  chartPreview.on('SetResizeData', function () {
    //setToActualSize();
  });


  return {
    on: events.on,
    destroy: destroy,
    chart: chartPreview,
    getIcons: getIcons,
    resize: resize,
    hide: hide,
    show: show,
    createMostPopularTemplates: createMostPopularTemplates,
    isVisible: function() {
      return isVisible;
    },
    init: init,
    selectSeriesTemplate: selectSeriesTemplate
    //toolbar: toolbar
  };
};
