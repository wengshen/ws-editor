

// @format

/* Keeps track of validations */

(function() {
  // Keyed on ID
  var validators = {};

  ws.validators = {
    /**
         * Add a validator
         * @param id {string} - the id
         * @param fn {function} - the validator function
         */
    add: function(id, fn) {
      if (id && !validators[id] && ws.isFn(fn)) {
        validators[id] = fn;
        return true;
      }

      return false;
    },

    /**
         * Execute a validator
         * @param id {string} - the id of the validator
         * @param chart {Chart} - the charts whose data to validate
         * @return {boolean} - true if valid
         */
    validate: function(id, chart) {
      return validators[id] ? validators[id](chart) : true;
    }
  };
})();
