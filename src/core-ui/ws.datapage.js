

// @format

/* global window */

ws.DataPage = function(parent, options, chartPreview, chartFrame, props) {
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
    container = ws.dom.cr(
      'div',
      'ws-transition ws-toolbox ws-box-size'
    ),
    title = ws.dom.cr('div', 'ws-dtable-title'),
    chartTitle = ws.dom.cr('div', 'ws-toolbox-body-chart-title'),
    chartTitleInput = ws.dom.cr('input', 'ws-toolbox-chart-title-input'),
    contents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-inner-body'
    ),
    userContents = ws.dom.cr(
      'div',
      'ws-box-size ws-toolbox-user-contents ws-toolbox-dtable'
    ),
    helpIcon = ws.dom.cr(
      'div',
      'ws-toolbox-help ws-icon fa fa-question-circle'
    ),
    iconClass = 'ws-box-size ws-toolbox-bar-icon fa ' + props.icon,
    icon = ws.dom.cr('div', iconClass),
    helpModal = ws.HelpModal(props.help || []),
    // Data table
    dataTableContainer = ws.dom.cr('div', 'ws-box-size ws-fill'),
    body = ws.dom.cr(
      'div',
      'ws-toolbox-body ws-datapage-body ws-box-size ws-transition'
    ),
    dataTable = ws.DataTable(
      dataTableContainer,
      ws.merge(
        {
          importer: properties.importer
        },
        properties.dataGrid
      )
    ),   
    addRowInput = ws.dom.cr('input', 'ws-field-input ws-add-row-input'),
    addRowBtn = ws.dom.cr('button', 'ws-import-button ws-ok-button ws-add-row-btn small', 'Add'),
    addRowDiv = ws.dom.ap(ws.dom.cr('div', 'ws-dtable-extra-options'),
                ws.dom.ap(ws.dom.cr('div', 'ws-add-row-container'),
                  ws.dom.cr('span', 'ws-add-row-text ws-hide-sm', 'Add Rows'),
                  addRowInput,
                  addRowBtn
                )
              ),
    assignDataPanel = ws.AssignDataPanel(parent, dataTable),
    dataImportBtn = ws.dom.cr(
      'button',
      'ws-import-button ws-ok-button ws-sm-button',
      'Import');
    dataExportBtn = ws.dom.cr(
      'button',
      'ws-import-button ws-ok-button ws-hide-sm',
      'Export Data');
    dataClearBtn = ws.dom.cr(
      'button',
      'ws-import-button ws-ok-button ws-sm-button',
       ws.L('dgNewBtn')),
    blacklist = [
      'candlestick',
      'bubble',
      'pie'
    ];

    dataImportBtn.innerHTML += ' <span class="ws-hide-sm">Data</span>';
    dataClearBtn.innerHTML += ' <span class="ws-hide-sm">Data</span>';
    
    addRowInput.value = 1;
    ws.dom.on(addRowBtn, 'click', function(e) {
      
    assignDataPanel.getFieldsToHighlight(dataTable.removeAllCellsHighlight, true);
      for(var i=0;i<addRowInput.value; i++) {
        dataTable.addRow();
      }
    assignDataPanel.getFieldsToHighlight(dataTable.highlightCells, true);
    });

    ws.dom.on(dataImportBtn, 'click', function() {
      dataTable.showImportModal(0);
    }),
    ws.dom.on(dataExportBtn, 'click', function() {
      dataTable.showImportModal(1);
    }),
    
    ws.dom.on(dataClearBtn, 'click', function() {
      if (confirm('Start from scratch?')) {
        dataTable.clearData();
        assignDataPanel.init();
      }
    }),
    
    iconsContainer = ws.dom.cr('div', 'ws-toolbox-icons'),
    isVisible = true;

    function init() {

      if (!ws.onPhone()) {
        ws.dom.ap(iconsContainer, addRowDiv, dataClearBtn, dataImportBtn, dataExportBtn);
      } else {
        ws.dom.ap(iconsContainer, dataImportBtn);
      }

      ws.dom.ap(contents, ws.dom.ap(title, ws.dom.ap(chartTitle, chartTitleInput), iconsContainer), userContents);
      ws.dom.ap(body, contents);
  
      ws.dom.ap(userContents, dataTableContainer);
      dataTable.resize();

      if (ws.onPhone()){
        ws.dom.style(body, {
          top: '47px',
          position: 'relative'
        });
      }
      
      ws.dom.ap(parent, ws.dom.ap(container, body));
      
      assignDataPanel.init(dataTable.getColumnLength());

      expand();
      resizeChart();
    }

    function afterResize(func){
      var timer;
      return function(event){
        if(timer) clearTimeout(timer);
        timer = setTimeout(func,100,event);
      };
    }
    function resize() {
      if (isVisible) {
        resizeChart();
        setTimeout(function(){
          expand()
        }, 100);
        //expand();
      }
    }

    ws.dom.on(window, 'resize', afterResize(function(e){
      resize();
    }));
    

    function showHelp() {
      helpModal.show();
    }

    function expand() {
      //var bsize = ws.dom.size(bar);

      var newWidth = props.widths.desktop;
      if (ws.onTablet() && props.widths.tablet) newWidth = props.widths.tablet;
      else if (ws.onPhone() && props.widths.phone) newWidth = props.widths.phone;

      if (props.iconOnly) {
        return;
      }

   //console.log(bsize.h);
      ws.dom.style(body, {
        width: 100 + '%',
        //height: //(bsize.h - 55) + 'px',
        opacity: 1
      });

      if (!ws.onPhone()) {
        //(ws.dom.pos(assignDataPanel.getElement(), true).x - ws.dom.pos(dataTableContainer, true).x) - 10
        ws.dom.style(container, {
          //width: newWidth + '%'
          width:((ws.dom.pos(assignDataPanel.getElement(), true).x - ws.dom.pos(dataTableContainer, true).x) + 14) + 'px'
        });
      }

    events.emit('BeforeResize', newWidth);

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
        width: '100%',
        height: ((size.h - 16)) + 'px'
      });

      dataTable.resize();   
      if(!ws.onPhone()) assignDataPanel.resize(newWidth, ws.dom.pos(chartFrame, true).y - ws.dom.pos(body, true).y)
    }

    setTimeout(resizeBody, 300);
    ws.emit('UIAction', 'ToolboxNavigation', props.title);
    }

  function show() {
    ws.dom.style(container, {
      display: 'block'
    });
    assignDataPanel.show();
    isVisible = true;
    resizeChart();
    resize(); 
  }

  function hide() {
    ws.dom.style(container, {
      display: 'none'
    });
    assignDataPanel.hide();
    isVisible = false;
  }

  function destroy() {}

  function addImportTab(tabOptions) {
    dataTable.addImportTab(tabOptions);
  }

  function hideImportModal() {
    dataTable.hideImportModal();
  }

  assignDataPanel.on('RemoveSeries', function(length) {
    clearSeriesMapping();
    chartPreview.data.deleteSeries(length);

    const data = dataTable.toCSV(';', true, assignDataPanel.getAllMergedLabelAndData());

    chartPreview.data.csv({
      csv: data
    }, null, false, function() {
      

      var chartOptions = chartPreview.options.getCustomized();
      var assignDataOptions = assignDataPanel.getAllOptions();    
      
      if (chartOptions && chartOptions.series) {
        if (chartOptions.series.length < assignDataOptions.length) {
          var optionsLength = chartOptions.series.length
          var assignDataOptionsLength = assignDataOptions.length
          var type

          if (chartOptions.series.length != 0) type = chartOptions.series[chartOptions.series.length - 1].type;
          if (blacklist.includes(type)) type = null;

          for(var i=optionsLength; i<assignDataOptionsLength; i++) {
            chartPreview.options.addBlankSeries(i, type);
          }
        }
      }

      setSeriesMapping(assignDataPanel.getAllOptions());
    });
  });
  
  function changeAssignDataTemplate(newTemplate, loadTemplateForEachSeries, cb) {
    
    if (dataTable.isInCSVMode()) {
      
      clearSeriesMapping();        
      
      var seriesIndex = [];
      assignDataPanel.setAssignDataFields(newTemplate, dataTable.getColumnLength(), null, null, true);
      if (loadTemplateForEachSeries) {
        const length = assignDataPanel.getAllOptions().length;
        
        for(var i=0;i<length;i++) {
          seriesIndex.push(i);
          assignDataPanel.setAssignDataFields(newTemplate, dataTable.getColumnLength(), null, i, true, i + 1);
        }
      } else seriesIndex = [assignDataPanel.getActiveSerie()];

      chartPreview.loadTemplateForSerie(newTemplate, seriesIndex);

      const data = dataTable.toCSV(';', true, assignDataPanel.getAllMergedLabelAndData());
      
      chartPreview.data.csv({
        csv: data
      }, null, false, function() {
        setSeriesMapping(assignDataPanel.getAllOptions());
        redrawGrid(true);
        if (cb) cb();
      });
    } else {
      chartPreview.loadTemplate(newTemplate);
    }

    //assignDataPanel.getFieldsToHighlight(dataTable.highlightCells, true);
  }

  function getIcons() {
    return null;
  }

  function setChartTitle(title) {
    chartTitleInput.value = title;
  }

  function showDataTableError() {
    dataTable.showDataTableError();
  }
  function hideDataTableError() {
    dataTable.hideDataTableError();
  }

  function getChartTitle() {
    return chartTitleInput.value;
  }

  function clearSeriesMapping() {

    var chartOptions = chartPreview.options.getCustomized();
    if (chartOptions.data && chartOptions.data.seriesMapping) {
      // Causes an issue when a user has added a assigndata input with seriesmapping, so just clear and it will add it in again later
      chartOptions.data.seriesMapping = null;
      chartPreview.options.setAll(chartOptions);  
    }

  }
  function setSeriesMapping(allOptions) {

    var tempOption = [],
        chartOptions = chartPreview.options.getCustomized(),
        dataTableFields = dataTable.getDataFieldsUsed(),
        hasLabels = false;
    
    var dataValues  = allOptions.data,
        series = allOptions.length;

    for(var i = 0; i < series; i++) {
      var serieOption = {};
      Object.keys(allOptions[i]).forEach(function(key) {
        const option = allOptions[i][key];
        if (option.value !== '') {
          if (option.isData) { //(ws.isArr(option)) { // Data assigndata
            if (dataTableFields.indexOf(option.rawValue[0]) > -1) {
              serieOption[option.linkedTo] = dataTableFields.indexOf(option.rawValue[0]);
            }
          } else {
            if (option.linkedTo === 'label') hasLabels = true;
            if (dataTableFields.indexOf(option.rawValue[0]) > -1) {
              serieOption[option.linkedTo] = dataTableFields.indexOf(option.rawValue[0]);
            }
            //serieOption[option.linkedTo] = option.rawValue[0];
          }
        }
      });
      tempOption.push(serieOption);
    };
    
    if (tempOption.length > 0) {
      if (hasLabels) {
        const dataLabelOptions = {
          dataLabels: {
              enabled: true,
              format: '{point.label}'
          }
        };

        if(chartOptions.plotOptions) {
          const seriesPlotOptions = chartOptions.plotOptions.series;
          ws.merge(seriesPlotOptions, dataLabelOptions);
          chartPreview.options.setAll(chartOptions);
        } else {
          chartPreview.options.setAll(ws.merge({
            plotOptions: {
              series: dataLabelOptions
            }
          }, chartOptions));
        }
      }

      if (chartOptions.data) {
        chartOptions.data.seriesMapping = tempOption;
        chartPreview.options.setAll(chartOptions);
      }
    }
  }

  function redrawGrid(clearGridFirst) {
    if (clearGridFirst) {
      var columns = [];
      for(var i = 0; i < dataTable.getColumnLength(); i++) {
        columns.push(i);
      }
      dataTable.removeAllCellsHighlight(null, columns);
    }
    
    assignDataPanel.checkToggleCells();
    
    assignDataPanel.getFieldsToHighlight(dataTable.highlightCells, true, true);
    chartPreview.data.setAssignDataFields(assignDataPanel.getAssignDataFields());
  }

  function loadProject(projectData, aggregated) {
    
    if (projectData.settings && projectData.settings.dataProvider && projectData.settings.dataProvider.csv) {
      dataTable.loadCSV({
        csv: projectData.settings.dataProvider.csv
      }, null, null, function() {
        
          assignDataPanel.enable();
          
          assignDataPanel.setAssignDataFields(projectData, dataTable.getColumnLength(), true, null, true, true, aggregated);
          assignDataPanel.getFieldsToHighlight(dataTable.highlightCells, true);
          chartPreview.data.setDataTableCSV(dataTable.toCSV(';', true, assignDataPanel.getAllMergedLabelAndData()));
      });

      //chartPreview.data.setAssignDataFields(assignDataPanel.getAssignDataFields());
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  assignDataPanel.on('GoToTemplatePage', function() {
    events.emit("GoToTemplatePage");
  })
  
  assignDataPanel.on('AddSeries', function(index, type) {
    chartPreview.options.addBlankSeries(index, type);
  })
  
  assignDataPanel.on('GetLastType', function() {
    var chartOptions = chartPreview.options.getCustomized();
    var type = chartOptions.series[chartOptions.series.length - 1].type;

    if (blacklist.includes(type)) type = null;

    assignDataPanel.setColumnLength(dataTable.getColumnLength());
    assignDataPanel.addNewSerie(type);
    
  })
  
  chartPreview.on('LoadProjectData', function(csv) {
    dataTable.loadCSV(
      {
        csv: csv
      },
      true
    );
  });

  chartPreview.on('ChartChange', function(newData) {
    events.emit('ChartChangedLately', newData);
  });

  assignDataPanel.on('DeleteSeries', function(index) {
    clearSeriesMapping();
    chartPreview.data.deleteSerie(index);

    const data = dataTable.toCSV(';', true, assignDataPanel.getAllMergedLabelAndData());
    chartPreview.data.csv({
      csv: data
    }, null, false, function() {
      setSeriesMapping(assignDataPanel.getAllOptions());
    });

  });

  assignDataPanel.on('SeriesChanged', function(index) {
    events.emit('SeriesChanged', index);
  });

  assignDataPanel.on('ToggleHideCells', function(options, toggle) {
    var userActiveCells = Object.keys(options).filter(function(key) {
      if(options[key].rawValue && options[key].rawValue.length > 0) return true;
    }).map(function(key) {
      return options[key].rawValue[0]
    });

    dataTable.toggleUnwantedCells(userActiveCells, toggle);

  });

  assignDataPanel.on('AssignDataChanged', function() {
    
    clearSeriesMapping();
    const data = dataTable.toCSV(';', true, assignDataPanel.getAllMergedLabelAndData());
    chartPreview.data.csv({
      csv: data
    }, null, false, function() {
      setSeriesMapping(assignDataPanel.getAllOptions());
    });

    assignDataPanel.getFieldsToHighlight(dataTable.highlightCells);
    chartPreview.data.setAssignDataFields(assignDataPanel.getAssignDataFields());

    //dataTable.highlightSelectedFields(input);
  });

  assignDataPanel.on('RedrawGrid', function(clearGridFirst) {
    redrawGrid(clearGridFirst);
  });

  assignDataPanel.on('ChangeData', function(allOptions) {
    //Series map all of the "linkedTo" options
    const data = dataTable.toCSV(';', true, assignDataPanel.getAllMergedLabelAndData());
    chartPreview.data.setAssignDataFields(assignDataPanel.getAssignDataFields());

    chartPreview.data.csv({
      csv: data
    }, null, false, function() {
      setSeriesMapping(allOptions);
    });
  });

  dataTable.on('DisableAssignDataPanel', function() {
    assignDataPanel.disable();
  });

  dataTable.on('EnableAssignDataPanel', function() {
    assignDataPanel.enable();
  });

  dataTable.on('ColumnMoving', function() {
    //assignDataPanel.resetValues();
    assignDataPanel.getFieldsToHighlight(dataTable.removeAllCellsHighlight, true);
  });

  dataTable.on('ColumnMoved', function() {
    //assignDataPanel.resetValues();
    assignDataPanel.getFieldsToHighlight(dataTable.highlightCells, true);
  });

  dataTable.on('InitLoaded', function() {
    assignDataPanel.getFieldsToHighlight(dataTable.highlightCells, true);
    //dataTable.highlightSelectedFields(assignDataPanel.getOptions());
  });

  dataTable.on('initExporter', function(exporter){
    exporter.init(
      chartPreview.export.json(),
      chartPreview.export.html(),
      chartPreview.export.svg(),
      chartPreview
    );
  });

  dataTable.on('AssignDataForFileUpload', function(rowsLength) {

    if (!rowsLength) rowsLength = dataTable.getColumnLength(); //Remove first column for the categories, and second as its already added
    assignDataPanel.setColumnLength(rowsLength);
    rowsLength -= 2;

    var chartOptions = chartPreview.options.getCustomized();
    var type = chartOptions.series[chartOptions.series.length - 1].type;

    if (!blacklist.includes(type)) {
      assignDataPanel.addSeries(rowsLength, type);
    }
  }); 

  dataTable.on('AssignDataChanged', function(input, options) {
    chartOptions = chartPreview.toProject().options;
    if (chartOptions.data && chartOptions.data.seriesMapping) { 
      // Causes an issue when a user has added a assigndata input with seriesmapping, so just clear and it will add it in again later
      chartOptions.data.seriesMapping = null;
      chartPreview.options.setAll(chartOptions);  
    }

    chartPreview.data.setAssignDataFields(assignDataPanel.getAssignDataFields());
    return chartPreview.data.csv({
      csv: dataTable.toCSV(';', true, options)
    });
  });

  dataTable.on('LoadLiveData', function(settings) {
    //chartPreview.data.live(settings);

    const liveDataSetting = {};

    liveDataSetting[settings.type] = settings.url;
    if (settings.interval && settings.interval > 0){
      liveDataSetting.enablePolling = true;
      liveDataSetting.dataRefreshRate = settings.interval
    }
    chartPreview.data.live(liveDataSetting);
  });
/*
  dataTable.on('UpdateLiveData', function(p){
    chartPreview.data.liveURL(p);
  });
*/

  dataTable.on('LoadGSheet', function(settings) {
    assignDataPanel.disable();
    chartPreview.data.gsheet(settings);
  });
  
  dataTable.on('Change', function(headers, data) {

    chartPreview.data.setDataTableCSV(dataTable.toCSV(';', true));

    chartPreview.data.csv({
      csv: dataTable.toCSV(';', true, assignDataPanel.getAllMergedLabelAndData())
    }, null, true, function() {
      setSeriesMapping(assignDataPanel.getAllOptions()); // Not the most efficient way to do this but errors if a user just assigns a column with no data in.
    });
  });

  dataTable.on('ClearData', function() {
    chartPreview.data.clear();
  });

  dataTable.on('ClearSeriesForImport', function() {
    var options = chartPreview.options.getCustomized();
    options.series = [];
    assignDataPanel.restart();
  });

  dataTable.on('ClearSeries', function() {
    var options = chartPreview.options.getCustomized();
    options.series = [];
  });

  chartPreview.on('ProviderGSheet', function(p) {
    assignDataPanel.disable();
    dataTable.initGSheet(
      p.id || p.googleSpreadsheetKey,
      p.worksheet || p.googleSpreadsheetWorksheet,
      p.startRow,
      p.endRow,
      p.startColumn,
      p.endColumn,
      true,
      p.dataRefreshRate
    );
  });

  chartPreview.on('ProviderLiveData', function(p) {
    assignDataPanel.disable();
    dataTable.loadLiveDataPanel(p);
  });


  function createSimpleDataTable(toNextPage, cb) {
    return dataTable.createSimpleDataTable(toNextPage, cb);
  } 

  function selectSwitchRowsColumns() {
    dataTable.selectSwitchRowsColumns()
  }

  function resizeChart(newWidth) {
    ws.dom.style(chartFrame, {
      /*left: newWidth + 'px',*/
      width: '28%',
      height: '38%'
    });
    chartPreview.resize();

    setTimeout(function() { chartPreview.resize(); }, 200);
  }
  chartPreview.on('SetResizeData', function () {
    //setToActualSize();
  });


  return {
    on: events.on,
    destroy: destroy,
    addImportTab: addImportTab,
    hideImportModal: hideImportModal,
    chart: chartPreview,
    resize: resize,
    data: {
      on: dataTable.on,
      showLiveStatus: function(){}, //toolbox.showLiveStatus,
      hideLiveStatus: function(){}//toolbox.hideLiveStatus
    },
    hide: hide,
    show: show,
    dataTable: dataTable,
    isVisible: function() {
      return isVisible;
    },
    init: init,
    setChartTitle: setChartTitle,
    getChartTitle: getChartTitle,
    getIcons: getIcons,
    changeAssignDataTemplate: changeAssignDataTemplate,
    createSimpleDataTable: createSimpleDataTable,
    loadProject: loadProject,
    showDataTableError: showDataTableError,
    hideDataTableError: hideDataTableError,
    selectSwitchRowsColumns: selectSwitchRowsColumns
  };
};
