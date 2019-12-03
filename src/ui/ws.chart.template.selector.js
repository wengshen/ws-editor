

// @format

/** UI for selecting a chart template from the ones defined in meta/ws.meta.charts.js
 *
 *  @example
 *  var picker = ws.ChartTemplateSelector(document.body);
 *  picker.on('Select', function (template) {
 *      console.log('Selected new template:', template);
 *  });
 *
 *  @constructor
 *
 *  @param parent {domnode} - the parent to attach the selector to
 *
 *  @emits Select - when selecting a template
 *    > {object} - the template definition
 *  @emits Hover - when hovering a template
 *    > {object} - the template definition
 */
ws.ChartTemplateSelector = function(parent, chartPreview) {
  var events = ws.events(),
    container = ws.dom.cr('div', 'ws-chart-templates'),
    //splitter = ws.HSplitter(container, { leftWidth: 30 }),
    //list = ws.List(splitter.left),
    //templates = splitter.right,
    templates = ws.dom.cr('div', 'ws-chart-template-type-container'),
    catNode = ws.dom.cr('div', 'ws-chart-template-cat-desc'),
    selected = false,
    templateTypeSelect = ws.DropDown(container, null, {
      area: ws.resources.icons.area,
      line: ws.resources.icons.line,
      bar: ws.resources.icons.bar,
      column: ws.resources.icons.column,
      more: ws.resources.icons.more,
      pie: ws.resources.icons.pie,
      polar: ws.resources.icons.polar,
      stock: ws.resources.icons.stock,
      'scatter and bubble': ws.resources.icons['scatter and bubble']
    }),
    detailValue;

  
  ws.dom.ap(parent, ws.dom.ap(container, templates));
  //splitter.right.className += ' ws-chart-template-frame';

  ///////////////////////////////////////////////////////////////////////////

  function createSampleBtn(target, sample) {
    var btn,
      dset = ws.samples.get(sample);

    if (!dset) {
      return;
    }

    btn = sampleBtn = ws.dom.cr('div', 'ws-ok-button', dset.title);

    ws.dom.on(btn, 'click', function() {
      if (
        confirm(
          'You are about to load the ' +
            dset.title +
            ' sample set. This will purge any existing data in the chart. Continue?'
        )
      ) {
        events.emit('LoadDataSet', dset);
      }
    });

    ws.dom.ap(target, btn);
  }

  function buildCatMeta(catmeta) {
    var title = ws.dom.cr('h3', '', catmeta.id),
      desc = ws.dom.cr('div'),
      samples = ws.dom.cr('div');

    desc.innerHTML = ws.isArr(catmeta.description)
      ? catmeta.description.join('<br/><br/>')
      : catmeta.description || '';

    if (catmeta.samples && catmeta.samples.length > 0) {
      ws.dom.ap(samples, ws.dom.cr('h4', '', 'Sample Data Sets'));

      catmeta.samples.forEach(function(sample) {
        createSampleBtn(samples, sample);
      });
    }

    ws.dom.ap(title, desc, samples);
  }

  function showTemplates(templateList, masterID, catmeta) {
    var compatible = 0;

    templates.innerHTML = '';
    catNode.innerHTML = '';

    if (catmeta) {
      buildCatMeta(catmeta);
    }

    ws.dom.ap(templates);

    Object.keys(templateList).forEach(function(key) {
      var t = templateList[key],
        node = ws.dom.cr('div', 'ws-chart-template-container ws-template-tooltip'),
        body = ws.dom.cr('div', 'ws-chart-template-body'),
        preview = ws.dom.cr('div', 'ws-chart-template-thumbnail'),
        titleBar = ws.dom.cr('div', 'ws-tooltip-text', t.title),
        description = ws.dom.cr('div', 'ws-chart-template-description'),
        samples = ws.dom.cr('div', 'ws-chart-template-samples');

      if (t.validator) {
        if (!ws.validators.validate(t.validator, chartPreview || false)) {
          return;
        }
      }

      compatible++;

      (ws.isArr(t.sampleSets)
        ? t.sampleSets
        : (t.sampleSets || '').split('.')
      ).forEach(function(sample, i) {
        if (i === 0) {
          ws.dom.ap(samples, ws.dom.cr('h4', '', 'Sample Data Sets'));
        }

        createSampleBtn(samples, sample);
      });

      description.innerHTML = ws.isArr(t.description)
        ? t.description.join('<br/><br/>')
        : t.description;

      if (selected && selected.id === masterID + key + t.title) {
        node.className =
          'ws-chart-template-container ws-chart-template-preview-selected ws-template-tooltip';
        selected.node = node;
      }

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

      ws.dom.on(node, 'click', function() {
        if (selected) {
          selected.node.className = 'ws-chart-template-container ws-template-tooltip';
        }

        node.className =
          'ws-chart-template-container ws-chart-template-preview-selected ws-template-tooltip';

        selected = {
          id: masterID + key + t.title,
          node: node
        };

        // If this is a map, we need to include the map collection
        if (t.constructor === 'Map') {
          var loadedSeries = 0;

          (t.config.series || []).forEach(function(series) {
            function incAndCheck() {
              loadedSeries++;
              if (loadedSeries === t.config.series.length) {
                events.emit('Select', t);
              }
            }

            if (series.mapData) {
              if (ws.isStr(series.mapData)) {
                ws.include(
                  'https://code.highcharts.com/mapdata/' +
                    series.mapData +
                    '.js',
                  function() {
                    series.mapData = Highcharts.maps[series.mapData];
                    incAndCheck();
                  }
                );
              } else {
                incAndCheck();
              }
            } else {
              incAndCheck();
            }
          });
        } else {
          t.header =  templateTypeSelect.getSelectedItem().title();
          events.emit('Select', ws.merge({}, t));
        }

        ws.emit('UIAction', 'TemplateChoose', t.title);
      });

      ws.dom.ap(
        templates,
        ws.dom.ap(
          node,
          preview,
          titleBar/*,
          ws.dom.ap(
            body,
            titleBar//,
            //description,
            // ws.dom.cr('h4', '', 'Sample Data Sets'),
            //samples
          )*/
        )
      );
      
    });

    if (compatible === 0) {
      ws.dom.ap(
        templates,
        ws.dom.ap(
          ws.dom.cr('div', 'ws-chart-template-404'),
          ws.dom.cr(
            'h4',
            '',
            'None of the templates in this category fits your dataset.'
          ),
          ws.dom.cr('div', '', catmeta ? catmeta.nofits || '' : '')
        )
      );
    } else {
    }
  }

  /* Force a resize */
  function resize(w, h) {
    var lsize;

    //splitter.resize(w, h);
    //list.resize();
/*
    lsize = ws.dom.size(list.container);
    ws.dom.style(templates, {
      minHeight: lsize.h + 'px'
    });*/
  }

  /* Build the UI */
  function build() {
    templateTypeSelect.addItems(ws.templates.getCatArray());
    templateTypeSelect.selectByIndex(0); // TODO: Need to change this later

    //ws.dom.ap(container, templateTypeSelect);

    //list.addItems(ws.templates.getCatArray());
    //list.selectFirst();
  }

  function selectSeriesTemplate(index, projectData) {
    const settings = projectData; //projectData.settings && projectData.settings.template;
    var templateHeader, templateTitle;
    if (settings && !settings[index]) {
      templateHeader = 'Line';
      templateTitle = 'Line chart';
    }
    else if (settings && settings[index]) {
      //Select this template
      templateHeader = settings[index].templateHeader;
      templateTitle = settings[index].templateTitle;
    } 
    else return ;

    templateTypeSelect.selectById(templateHeader);
    
    var templates = ws.templates.getAllInCat(templateHeader);
    selected = {
      id:  templateHeader + templateTitle + templateTitle
    };
    
    if (templates) {
      showTemplates(templates, templateHeader, ws.templates.getCatInfo(templateHeader));
    }
    
  }

  ///////////////////////////////////////////////////////////////////////////

  templateTypeSelect.on('Change', function(selected) {
    detailValue = selected.id();

    var templates = ws.templates.getAllInCat(detailValue);

    ws.emit('UIAction', 'TemplateCatChoose', detailValue);

    if (templates) {
      showTemplates(templates, detailValue, ws.templates.getCatInfo(detailValue));
    }

  });

/*
  list.on('Select', function(id) {
    var templates = ws.templates.getAllInCat(id);

    ws.emit('UIAction', 'TemplateCatChoose', id);

    if (templates) {
      showTemplates(templates, id, ws.templates.getCatInfo(id));
    }
  });
*/
  build();

  ///////////////////////////////////////////////////////////////////////////

  return {
    on: events.on,
    resize: resize,
    rebuild: build,
    selectSeriesTemplate: selectSeriesTemplate
  };
};
