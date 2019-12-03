

// @format

/* global window */

ws.DrawerEditor = function(parent, options, planCode) {
  var events = ws.events(),
    // Main properties
    properties = ws.merge(
      {
        defaultChartOptions: {},
        useHeader: false,  //是否开启头部控制
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
    errorBar = ws.dom.cr(
      'div',
      'ws-errorbar ws-box-size ws-transition'
    ),
    errorBarHeadlineContainer = ws.dom.cr(
      'div',
      'ws-errorbar-headline'
    ),
    errorBarHeadline = ws.dom.cr(
      'div',
      'ws-errorbar-headline-text',
      '错误提示!'
    ),
    errorBarClose = ws.dom.cr(
      'div',
      'ws-errorbar-close',
      '<i class="fa fa-times"/>'
    ),
    errorBarBody = ws.dom.cr(
      'div',
      'ws-errorbar-body ws-scrollbar',
      '错误异常提示内容'
    ),
    lastSetWidth = false,
    fixedSize = false,
      //布局
    splitter = ws.VSplitter(parent, {
      topHeight: properties.useHeader ? '60px' : '0px',
      noOverflow: true
    }),    
    builtInOptions = {
      data: {
        icon: 'fa-table',
        title: '数据',
        widths: {
          desktop: 66,
          tablet: 64,
          phone: 100
        },
        nav: {
          icon: 'table',
          text: '数据',
          onClick: []
        },
        help: [
          {
            title: 'Manually Add/Edit Data',
            gif: 'dataImport.gif',
            description: [
              'Click a cell to edit its contents.<br/><br/>',
              'The cells can be navigated using the arrow keys.<br/><br/>',
              'Pressing Enter creates a new row, or navigates to the row directly below the current row.'
            ]
          },
          {
            title: 'Setting headings',
            gif: 'dataImport.gif',
            description: [
              'The headings are used as the series titles.<br/><br/>',
              'They can be edited by left clicking them.<br/><br/>',
              'Click the arrow symbol in the header to access column properties.'
            ]
          },
          {
            title: 'Importing Data',
            gif: 'import.gif',
            description: [
              'To import data, simply drag and drop CSV files onto the table, or paste CSV/Excel data into any cell.<br/><br/>',
              'For more advanced data import, click the IMPORT DATA button.'
            ]
          }
        ],
        showLiveStatus: true
      },
      templates: {
        icon: 'fa-bar-chart',
        widths: {
          desktop: 26,
          tablet: 24,
          phone: 100
        },
        title: '图表模板',
        nav: {
          icon: 'bar-chart',
          text: '图表模板',
          onClick: []
        },
        help: [
          {
            title: '图表模板',
            description: [
              'Templates are pre-defined bundles of configuration.<br/><br/>',
              'Start by choosing the template category in the list to the left,',
              'then pick a suitable template for your data and use case in the',
              'template list.'
            ]
          }
        ]
      },
      customize: {
        icon: 'fa-sliders',
        title: '定制图表',
        nav: {
          icon: 'pie-chart',
          text: '定制图表',
          onClick: []
        },
        widths: {
          desktop: 27,
          tablet: 24,
          phone: 100
        },
        help: [
          {
            title: '定制',
            description: [
              'The customize pane lets you customize your chart.<br/><br/>',
              'The customizer has three different sections:<br/>',
              '<li>Simple: A simple customizer with the most used options</li>',
              '<li>Advanced: All options available in Highcharts/Highstock can be set here</li>',
              '<li>Custom code: Here, properties can be overridden programatically</li>'
            ]
          }
        ]
      },
    },
      //工作空间
    workspaceBody = ws.dom.cr(
      'div',
      'ws-optionspanel-body ws-box-size ws-transition'
    ),
    workspaceButtons = ws.dom.cr(
      'div',
      'ws-optionspanel-buttons ws-optionspanel-cloud ws-box-size ws-transition'
    ),
    smallScreenWorkspaceButtons = ws.dom.cr(
      'div',
      'ws-xs-workspace-buttons ws-optionspanel-xs-cloud ws-box-size ws-transition'
    ),
    workspaceRes = ws.dom.cr(
      'div',
      'ws-optionspanel-buttons ws-optionspanel-res ws-box-size ws-transition'
    ),
    defaultPage,
    panel = ws.OptionsPanel(workspaceBody),
    toolbar = ws.Toolbar(splitter.top),
    // Chart preview 预览区域容器
    wsChartContainer = ws.dom.cr('div', 'ws-chart-container ws-transition'),
    chartFrame = ws.dom.cr(
      'div',
      'ws-transition ws-box-size ws-chart-frame ws-scrollbar'
    ),
    showChartSmallScreen = ws.dom.cr(
      'div',
      'ws-transition ws-box-size ws-show-chart-xs',
      '<i class="fa fa-area-chart"/>'
    ),
    chartContainer = ws.dom.cr(
      'div',
      'ws-box-size ws-chart-frame-body'
    ),
    chartPreview = ws.ChartPreview(chartContainer, {
      defaultChartOptions: properties.defaultChartOptions
    }),
    suppressWarning = false,
    dataTableContainer = ws.dom.cr('div', 'ws-box-size ws-fill'),
    customizePage = ws.CustomizePage(
      splitter.bottom,
      ws.merge(
        {
          importer: properties.importer
        },
        properties.customizer
      ),
      chartPreview,
      wsChartContainer,
      builtInOptions.customize,
      chartFrame,
      planCode
    ),
    dataPage = ws.DataPage(
      splitter.bottom,
      ws.merge(
        {
          importer: properties.importer
        },
        properties.dataGrid
      ),
      chartPreview,
      wsChartContainer,
      builtInOptions.data
    ),
    templatePage = ws.TemplatePage(
      splitter.bottom,
      ws.merge(
        {
          importer: properties.importer
        },
        properties.dataGrid
      ),
      chartPreview,
      wsChartContainer,
      builtInOptions.templates
    );
    createChartPage = ws.CreateChartPage(
      splitter.bottom,
      properties.features,
      {
        title: 'Create Chart',
        widths: {
          desktop: 95
        }
      }
    ),

    // Res preview bar
    resPreviewBar = ws.dom.cr('div', 'ws-res-preview'),
    resWidth = ws.dom.cr('input', 'ws-res-number'),
    resHeight = ws.dom.cr('input', 'ws-res-number'),
    // Exporter
    exporterContainer = ws.dom.cr('div', 'ws-box-size ws-fill'),
    exporter = ws.Exporter(exporterContainer),
    // Templates
    templatesContainer = ws.dom.cr('div', 'ws-box-size ws-fill'),
    templates = ws.ChartTemplateSelector(templatesContainer, chartPreview),
    // Customizer
    customizerContainer = ws.dom.cr('div', 'ws-box-size ws-fill'),
    customizer = ws.ChartCustomizer(
      customizerContainer,
      properties.customizer,
      chartPreview
    ),
    // Toolbar buttons
    toolbarButtons = [
      {
        title: ws.L('newChart'),
        css: 'fa-file',
        click: function() {
          if (window.confirm(ws.getLocalizedStr('confirmNewChart'))) {
            chartPreview.new();
          }
        }
      },
      {
        title: ws.L('saveProject'),
        css: 'fa-floppy-o',
        click: function() {
          var name;

          if (chartPreview.options.full.title) {
            name = chartPreview.options.full.title.text;
          }

          name = (name || 'chart').replace(/\s/g, '_');

          ws.download(name + '.json', chartPreview.toProjectStr());
        }
      },
      {
        title: ws.L('openProject'),
        css: 'fa-folder-open',
        click: function() {
          ws.readLocalFile({
            type: 'text',
            accept: '.json',
            success: function(file) {
              try {
                file = JSON.parse(file.data);
              } catch (e) {
                return ws.snackBar('Error loading JSON: ' + e);
              }

              chartPreview.loadProject(file);
            }
          });
        }
      },
      '-',
      {
        title: ws.L('saveCloud'),
        css: 'fa-cloud-upload',
        click: function() {
          ws.cloud.save(chartPreview);
        }
      },
      {
        title: ws.L('loadCloud'),
        css: 'fa-cloud-download',
        click: function() {
          ws.cloud.showUI(chartPreview);
        }
      },
      '-',
      {
        title: 'Help',
        css: 'fa-question-circle',
        click: function() {
          window.open(ws.option('helpURL'));
        }
      }
    ].concat(properties.toolbarIcons),
    // Custom toolbox options
    customOptions = {},
    // The toolbox options

    helpIcon = ws.dom.cr(
      'div',
      'ws-toolbox-help ws-icon fa fa-question-circle'
    ),
    titleHeader = ws.dom.cr('h3', '', 'Data'),
    iconContainer = ws.dom.cr('div', ''),
    titleContainer = ws.dom.ap(ws.dom.cr('div', 'ws-page-title'), titleHeader, helpIcon, iconContainer),
    helpModal = ws.HelpModal(builtInOptions.data.help || []);

  ws.dom.on(helpIcon, 'click', showHelp);
  ws.dom.ap(splitter.bottom, ws.dom.ap(workspaceBody, workspaceRes, workspaceButtons));

  ws.dom.ap(splitter.bottom, titleContainer, smallScreenWorkspaceButtons);
  if (!properties.useHeader) {
    ws.dom.style(splitter.top.parentNode, {
      display: 'none'
    });
  }

  ws.dom.on(showChartSmallScreen, 'click', function() {
    if (wsChartContainer.classList.contains('active')) {
      wsChartContainer.classList.remove('active');
    } else {
      setTimeout(function(){
        chartPreview.resize();
      }, 200);
      wsChartContainer.classList += ' active';
    }
  });

  // Alias import to data
  builtInOptions.import = builtInOptions.data;
  panel.setDefault(dataPage);
  dataPage.show()
  /**
   * Creates the features defined in property.features
   * Call this after changing properties.features to update the options.
   */
  function createFeatures() {
    var addedOptions = {};
    panel.clearOptions();

    properties.features = ws.isArr(properties.features)
      ? properties.features
      : properties.features.split(' ');
    
    function addOption(option, id) {

      if (!option || !option.icon || !option.nav) {
        return;
      }
      
      if (id === 'data') {
        option.nav.page = dataPage;
        dataPage.init();
        option.nav.onClick.push(
          function() {
            ws.dom.style([wsChartContainer, chartContainer, chartFrame], {
              width: '100%',
              height: '100%',
            });
          }
        );
      } else if (id === 'templates') {
        option.nav.page = templatePage;
        templatePage.init();
      } else if (id === 'customize') {
        option.nav.page = customizePage;
        customizePage.init();
        ws.dom.ap(workspaceRes, customizePage.getResolutionContainer());
      } else {
        // Create page
        defaultPage = ws.DefaultPage(splitter.bottom, option, chartPreview, wsChartContainer);
        defaultPage.init();
        option.nav.page = defaultPage;
      }


      var func = function(prev, newOption) {
        prev.hide();
        newOption.page.show();
        panel.setDefault(newOption.page);
        titleHeader.innerHTML = newOption.text;
        helpModal = (option.help ? ws.HelpModal(option.help  || []) : null);
        
        ws.dom.style(helpIcon, {
          display: (helpModal ? 'inline' : 'none')
        });

        iconContainer.innerHTML = '';
        if (newOption.page.getIcons()) {
          ws.dom.ap(iconContainer, newOption.page.getIcons());
        }
        
        ws.dom.style(iconContainer, {
          display: (newOption.page.getIcons() ? 'inline' : 'none')
        });

      }


      if (id == 'customize') {
        option.nav.onClick = [func];
      } else {
        option.nav.onClick.push(func);
      }


      panel.addOption(option.nav, id);
      addedOptions[id] = id;

    }

    //toolbox.clear();
    resize();
    
    properties.features.forEach(function(feature) {
      addOption(
        builtInOptions[feature] || customOptions[feature] || false,
        feature
      );
    });
    toolboxEntries = addedOptions;
    // resizeChart(toolbox.width());
  }

  function showHelp() {
    helpModal.show();
  }

  /**
   * Create toolbar
   */
  function createToolbar() {
    toolbarButtons.forEach(function(b) {
      if (b === '-') {
        toolbar.addSeparator();
      } else {
        toolbar.addIcon(b);
      }
    });
  }

  function showCreateChartPage() {

    createChartPage.init(dataPage, templatePage, customizePage);

    ws.dom.style([workspaceBody, showChartSmallScreen, smallScreenWorkspaceButtons], {
      opacity: 0
    });
    panel.getPrev().hide();
    createChartPage.show();
    ws.dom.style([chartFrame, titleContainer], {
      opacity: '0'
    });

    if(ws.onPhone()) {
      ws.dom.style(titleContainer, {
        display: 'none'
      });
    }

    createChartPage.on('SimpleCreateChartDone', function(goToDataPage) {
      createChartPage.hide();
      ws.dom.style([chartFrame, titleContainer], {
        opacity: '1'
      });
      ws.dom.style([workspaceBody, showChartSmallScreen, smallScreenWorkspaceButtons], {
        opacity: 1
      });

      if(ws.onPhone()) {
        ws.dom.style(titleContainer, {
          display: 'block'
        });
      }

      if (goToDataPage) {
        dataPage.show();
        panel.setDefault(dataPage);
        dataPage.resize();
      } else {

        const customize = panel.getOptions().customize;

        if (customize) {
          customizePage.setTabBehaviour(true)
          customize.click();
        }
/*
        titleHeader.innerHTML = builtInOptions.customize.title;
        customizePage.show();
        panel.setDefault(customizePage);*/
      }
    });

    createChartPage.on('SimpleCreateChangeTitle', function(options) {
      chartPreview.options.set('title--text', options.title);
      chartPreview.options.set('subtitle--text', options.subtitle);
      setChartTitle(options.title);
    });
  }



  /**
   * Resize the chart preview based on a given width
   */
  function resizeChart(newWidth) {
    var psize = ws.dom.size(splitter.bottom);

    lastSetWidth = newWidth;

    ws.dom.style(wsChartContainer, {
      /*left: newWidth + 'px',*/
      width: '28%',
      height: '37%'
    });

    if (fixedSize) {
      // Update size after the animation is done
      setTimeout(function() {
        sizeChart(fixedSize.w, fixedSize.h);
      }, 400);
      return;
    }
/*
    ws.dom.style(chartContainer, {
      width: psize.w - newWidth - 100 + 'px',
      height: psize.h - 100 + 'px'
    });*/

    chartPreview.resize();
  }

  function sizeChart(w, h) {
    if ((!w || w.length === 0) && (!h || h.length === 0)) {
      fixedSize = false;
      resHeight.value = '';
      resWidth.value = '';
      resizeChart(lastSetWidth);
    } else {
      var s = ws.dom.size(wsChartContainer);

      // ws.dom.style(chartFrame, {
      //   paddingLeft: (s.w / 2) - (w / 2) + 'px',
      //   paddingTop: (s.h / 2) - (h / 2) + 'px'
      // });

      fixedSize = {
        w: w,
        h: h
      };

      w = w || s.w - 100;
      h = h || s.h - 100;
/*
      ws.dom.style(chartContainer, {
        width: w + 'px',
        height: h + 'px'
      });
*/
      chartPreview.resize();
    }
  }

  /**
   * Resize everything
   */
  function resize() {
    splitter.resize();
    panel.getPrev().resize()
    //resizeChart(toolbox.width());
  }

  /**
   * Change the enabled features
   */
  function setEnabledFeatures(feats) {
    properties.features = feats;
    createFeatures();
  }

  /**
   * Add a new feature
   */
  function addFeature(name, feat) {
    customOptions[name] = feat;
    //addPage(feat);
    createFeatures();
  }

  function addToWorkspace(options) {

    const btn = ws.dom.cr('button', 'ws-import-button green action-btn', "Action <i class='fa fa-chevron-down'/>");
    const btn2 = ws.dom.cr('button', 'ws-import-button green action-btn', "Action <i class='fa fa-chevron-down'/>");
    
    ws.dom.on(btn, 'click', function() {
      ws.dom.style(workspaceButtons, {
        overflow: (workspaceButtons.style.overflow === '' || workspaceButtons.style.overflow === 'hidden' ? 'unset' : 'hidden')
      });
    });

    ws.dom.on(btn2, 'click', function() {
      ws.dom.style(smallScreenWorkspaceButtons, {
        overflow: (smallScreenWorkspaceButtons.style.overflow === '' || smallScreenWorkspaceButtons.style.overflow === 'hidden' ? 'unset' : 'hidden')
      });
    });

    ws.dom.ap(workspaceButtons, btn);
    ws.dom.ap(smallScreenWorkspaceButtons, btn2);

    options.forEach(function(option, index) {
      const btn = ws.dom.cr('button', 'ws-import-button green ws-sm-dropdown-button' + (!index ? ' ws-btn-dropdown-first' : ''), option.text);
      ws.dom.on(btn, 'click', option.onClick);

      const btn2 = ws.dom.cr('button', 'ws-import-button green ws-sm-dropdown-button' + (!index ? ' ws-btn-dropdown-first' : ''), option.text);
      ws.dom.on(btn2, 'click', option.onClick);

      ws.dom.ap(workspaceButtons, btn);
      ws.dom.ap(smallScreenWorkspaceButtons, btn2);
      
      
    });
  }

  function destroy() {}

  function setChartTitle(title) {
    dataPage.setChartTitle(title);
  }

  function addImportTab(tabOptions) {
    dataPage.addImportTab(tabOptions);
  }

  function hideImportModal() {
    //dataTable.hideImportModal();
  }
  
  function showError(title, message, warning, code) {
    if (warning) {
      if (suppressWarning) return;
      
      ws.dom.style(errorBarClose, {
        display: 'inline-block'
      });
      
      if (!errorBar.classList.contains('ws-warningbar')) errorBar.classList += ' ws-warningbar';
    } else {
      ws.dom.style(errorBarClose, {
        display: 'none'
      });
  
      errorBar.classList.remove('ws-warningbar');
    }
    
    ws.dom.style(errorBar, {
      opacity: 1,
      'pointer-events': 'auto',
    });

    errorBarHeadline.innerHTML = title;
    errorBarBody.innerHTML = message;

    if (code === 14) {
      dataPage.showDataTableError();
    }
  }

  function hideError() {
    ws.dom.style(errorBar, {
      opacity: 0,
      'pointer-events': 'none'
    });
    dataPage.hideDataTableError();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Event attachments

  dataPage.on('GoToTemplatePage', function() {
    const templates = panel.getOptions().templates;
    if (templates) templates.click();
  });

  dataPage.on('SeriesChanged', function(index) {
    if ((!options && !options.features) || (options.features && options.features.indexOf('templates') > -1)) {
      templatePage.selectSeriesTemplate(index, chartPreview.options.getTemplateSettings());
    }
  });

  chartPreview.on('LoadProject', function (projectData, aggregated) { 
    dataPage.loadProject(projectData, aggregated);
    templatePage.selectSeriesTemplate(0, projectData);
  });

  templatePage.on('TemplateChanged', function(newTemplate, loadTemplateForEachSerie, cb){
    dataPage.changeAssignDataTemplate(newTemplate, loadTemplateForEachSerie, cb);
  })
  chartPreview.on('ChartChange', function(newData) {
    events.emit('ChartChangedLately', newData);
  });

  templates.on('Select', function(template) {
    chartPreview.loadTemplate(template);
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
/*
  dataTable.on('LoadLiveData', function(settings){
    //chartPreview.data.live(settings);

    const liveDataSetting = {};

    liveDataSetting[settings.type] = settings.url;
    if (settings.interval && settings.interval > 0){
      liveDataSetting.enablePolling = true;
      liveDataSetting.dataRefreshRate = settings.interval
    }
    chartPreview.data.live(liveDataSetting);
  });*/
/*
  dataTable.on('UpdateLiveData', function(p){
    chartPreview.data.liveURL(p);
  });
*/
  chartPreview.on('LoadProject', function () {
    setTimeout(function () {
 //   resQuickSel.selectByIndex(0);
    setToActualSize();
    }, 2000);
  });
/*
  dataTable.on('LoadGSheet', function(settings) {
    //chartPreview.data.gsheet(settings);
  });
*/
  chartPreview.on('RequestEdit', function(event, x, y) {

    const customize = panel.getOptions().customize;
    if (!panel.getCurrentOption() || panel.getCurrentOption().text !== 'Customize') {
      if (customize) {
        customizePage.setTabBehaviour(false)
        customize.click();
      }
    }

    setTimeout(function() {
      customizePage.selectOption(event, x, y);
    }, 500);
  });
/*
  dataTable.on('Change', function(headers, data) {
    
    return chartPreview.data.csv({
      csv: dataTable.toCSV(';', true)
    });
  });*/
/*
  dataTable.on('ClearData', function() {
    chartPreview.data.clear();
  });*/

  chartPreview.on('ProviderGSheet', function(p) {
    /*
    dataTable.initGSheet(
      p.id || p.googleSpreadsheetKey,
      p.worksheet || p.googleSpreadsheetWorksheet,
      p.startRow,
      p.endRow,
      p.startColumn,
      p.endColumn,
      true,
      p.dataRefreshRate
    );*/
  });

  chartPreview.on('ProviderLiveData', function(p) {
    //dataTable.loadLiveDataPanel(p);
  });

  chartPreview.on('Error', function(e) {
    if (e && e.code && ws.highchartsErrors[e.code]) {
      
      var item = ws.highchartsErrors[e.code],
          url = '';

      if (e.url >= 0) {
        url =
          '<div class="ws-errorbar-more"><a href="https://' +
          e.substr(e.url) +
          '" target="_blank">Click here for more information</a></div>';
      }

      return showError(
        (item.title || "There's a problem with your chart") + '!',
        (item.text) + url,
        e.warning,
        e.code
      );
    }

    showError("There's a problem with your chart!", e);
  });

  chartPreview.on('ChartRecreated', hideError);

  ws.dom.on(window, 'resize', resize);
  
  ws.dom.on(window, 'afterprint', function() {
    setTimeout(function() {
      const currentOption = (panel.getCurrentOption() ? panel.getCurrentOption().page : dataPage);
      setTimeout(currentOption.resize, 10);
      resize();
    }, 1100);
  })
  //////////////////////////////////////////////////////////////////////////////

  ws.dom.ap(
    toolbar.left,
    ws.dom.style(ws.dom.cr('span'), {
      'margin-left': '2px',
      width: '200px',
      height: '60px',
      float: 'left',
      display: 'inline-block',
      'background-position': 'left middle',
      'background-size': 'auto 100%',
      'background-repeat': 'no-repeat',
      'background-image':
        'url("data:image/svg+xml;utf8,' +
        encodeURIComponent(ws.resources.logo) +
        '")'
    })
  );
  
  ws.dom.on(errorBarClose, 'click', function() {
    hideError();
    suppressWarning = true;
  });

  ws.dom.ap(
    splitter.bottom,
    ws.dom.ap(
      wsChartContainer,
      ws.dom.ap(chartFrame, chartContainer)
    ),
    showChartSmallScreen,
    ws.dom.ap(errorBar, ws.dom.ap(errorBarHeadlineContainer, errorBarHeadline, errorBarClose), errorBarBody)
  );

  ws.dom.on([resWidth, resHeight], 'change', function() {
    sizeChart(parseInt(resWidth.value, 10), parseInt(resHeight.value, 10));
  });

  // Create the features
  createFeatures();
  createToolbar();

  resize();

  function setToActualSize() {
    resWidth.disabled = resHeight.disabled = 'disabled';
    chartPreview.getHighchartsInstance(function(chart) {
      var w, h;

      if (!chart || !chart.options || !chart.options.chart) {
        h = 400;
      } else {
        w = chart.options.chart.width;
        h = chart.options.chart.height || 400;
      }

      resWidth.value = w;
      resHeight.value = h;

      sizeChart(w, h);
    });
/*
    ws.dom.style(chartFrame, {
      'overflow-x': 'auto'
    });*/
  }

  chartPreview.on('AttrChange', function(option) {
    if (option.id === 'chart.height' || option.id === 'chart.width') {
     //resQuickSel.selectByIndex(0);
      // setToActualSize();
    }
  });
  
  chartPreview.on('SetResizeData', function () {
    setToActualSize();
  });
  return {
    on: events.on,
    resize: resize,
    destroy: destroy,
    /* Get embeddable javascript */
    getEmbeddableHTML: chartPreview.export.html,
    /* Get embeddable json */
    getEmbeddableJSON: chartPreview.export.json,
    /* Get embeddable SVG */
    getEmbeddableSVG: chartPreview.export.svg,
    addImportTab: addImportTab,
    hideImportModal: hideImportModal,
    setEnabledFeatures: setEnabledFeatures,
    addFeature: addFeature,
    chart: chartPreview,
    toolbar: toolbar,
    getChartTitle: dataPage.getChartTitle,
    setChartTitle: setChartTitle,
    showCreateChartPage: showCreateChartPage,
    addToWorkspace: addToWorkspace,
    data: {
      on: function() {}, //dataTable.on,
      showLiveStatus: function() {}, //toolbox.showLiveStatus,
      hideLiveStatus: function() {} //toolbox.hideLiveStatus
    },
    //dataTable: dataTable,
    toolbar: toolbar
  };
};
