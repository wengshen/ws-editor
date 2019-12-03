
// @format

(function() {
  // Samples, keyed on ID
  var samples = {};

  ws.samples = {
    /**
         * Add a sample to the sample collection
         *
         * This should be linked to templates too,
         * both in the sense that templates should have a list of
         * ID's for suitable sample data, and in the sense that
         * when displaying sample data it should display what kind of
         * chart types the data is valid for.
         *
         * The latter can be done automatically by cross-checking templates.
         *
         * @param {object} sample - the sample definition
         *    > id {anything} - the ID of the sample
         *    > title {anything} - the sample title
         *    > description {string} - the sample description
         *    > dataset {array<array<object>>} - the sample data
         *    > suitableSeries {object} - the kind of series this is suitable for
         */
    add: function(sample) {
      var options = ws.merge(
        {
          title: 'Untitled Sample',
          description: 'Untitled Sample',
          dataset: [],
          suitableSeries: false,
          products: false
        },
        sample
      );

      if (options.id && !samples[options.id]) {
        samples[options.id] = options;
        return true;
      }

      return false;
    },

    /**
         * Do something for each sample
         * @param fn {function} - the callback
         * @param productFilter {string} - the product(s) to include (optional)
         * @param typeFilter {string} - the series type(s) to include (optional)
         */
    each: function(fn, productFilter, typeFilter) {
      if (ws.isFn(fn)) {
        Object.keys(samples).forEach(function(id) {
          fn(samples[id]);
        });
      }
    },

    /**
         * Get a single sample set
         * @param id {string} - the id of the sample set to get
         * @returns {sample|false} - false if 404, sample if found
         */
    get: function(id) {
      return samples[id] || false;
    }
  };
})();
