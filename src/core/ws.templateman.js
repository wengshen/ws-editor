

// @format

ws.templates = {};

(function() {
  /* Templates */
  var templates = {},
      mostPopularTemplates = {};

  /** Install a new template
     *
     *  @example
     *  ws.installTemplate('custom', {
     *      title: 'My company template',
     *      tooltipText: 'Company template: requires no particular data',
     *      config: {
     *           'chart--title': 'Company Chart'
     *      }
     *  });
     *
     *  @param type {string} - template type: `line area column bar scatter pie polar stock`
     *  @param def {object} - the template definition
     *    > title {string} - the template title
     *    > config {object} - the highcharts attributes
     *    > tooltipText {string} - the tooltip text
     */
  ws.templates.add = function(type, def) {
    var properties = ws.merge(
      {
        title: '',
        description: '',
        constructor: '',
        thumbnail: '',
        icon: '',
        sampleSets: [],
        validator: false,
        config: {}
      },
      def
    );

    if (!ws.isBasic(type)) {
      return false;
    }

    templates[type] = templates[type] || {
      description: '',
      icon: '',
      sampleData: [],
      templates: {}
    };

    if (properties.title.length) {
      if (properties.popular) {
        properties.parent = type;
        mostPopularTemplates[type] = properties;
      }

      if (properties.icon) templates[type].icon = properties.icon;
      templates[type].templates[properties.title] = properties;
      ws.log(4, '[templateman] - added template', properties.title);
      return true;
    }

    return false;
  };

  /**
     * Do something for each template
     * @param fn {function} - the callback
     */
  ws.templates.each = function(fn) {
    if (ws.isFn(fn)) {
      Object.keys(templates).forEach(function(cat) {
        Object.keys(templates[cat].templates).forEach(function(id) {
          fn(cat, templates[cat].templates[id]);
        });
      });
    }
  };

  /**
     * Do something for each template within a given category
     * @param cat {string} - the category to filter by
     * @param fn {function} - the callback
     */
  ws.templates.eachInCategory = function(cat, fn) {
    if (ws.isFn(fn) && templates[cat]) {
      Object.keys(templates[cat].templates).forEach(function(id) {
        fn(templates[cat].templates[id]);
      });
    }
  };

  /**
     * Get a reference to the templates within a given category
     */
  ws.templates.getAllInCat = function(cat) {
    return templates[cat] ? templates[cat].templates : false;
  };

  /**
     * Get category meta
     */
  ws.templates.getCatInfo = function(cat) {
    return ws.merge(
      {
        id: cat
      },
      templates[cat] || {}
    );
  };


  ws.templates.getMostPopular = function() {
    return mostPopularTemplates;
  }

  /**
     * Get a list of id/title pairs for templates
     */
  ws.templates.getCatArray = function() {
    return Object.keys(templates).map(function(cat) {
      return {
        id: cat,
        title: cat,
        icon: templates[cat].icon
      };
    });
  };

  /**
     * Add meta information to a category
     */
  ws.templates.addCategory = function(id, meta) {
    templates[id] = templates[id] || {
      templates: {}
    };

    ws.merge(templates[id], meta, false, { templates: 1 });
  };

  /**
     * Do something with each category
     * @param fn {function} - the callback
     */
  ws.templates.eachCategory = function(fn) {
    if (ws.isFn(fn)) {
      Object.keys(templates).forEach(function(id) {
        fn(id, templates[id]);
      });
    }
  };

  /** Flush templates */
  ws.templates.flush = function() {
    templates = {};
  };

  /** Add a new template type
     *  If the type already exists, nothing will happen
     *
     *  @example
     *  ws.addTemplateType('custom', 'My company templates');
     *
     *  @param type {string} - the type id
     *  @param title {string} - the title as it appears in the category list
     */
  ws.templates.addType = function(type, title) {
    if (typeof templates === 'undefined') {
      templates = {};
    }

    if (typeof templates[type] === 'undefined') {
      templates[type] = {
        title: title,
        templates: {}
      };
    }
  };

  /** Add a set of templates
      * @example
      * ws.installMultipleTemplates([
      *   {type: 'line', template: {title: 'My Line Template', config: {}}}
      * ]);
      *
      * @param templates {array} - an array of templates
      *
      */
  ws.templates.addMultiple = function(templates) {
    if (typeof templates === 'undefined') {
      templates = {};
    }

    if (ws.isArr(templates)) {
      templates.forEach(function(template) {
        if (template.type && template.template) {
          ws.installTemplate(template.type, template.template);
        }
      });
    }
  };
})();
