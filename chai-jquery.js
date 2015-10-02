(function (chaiJquery) {
  // Module systems magic dance.
  if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
    // NodeJS
    module.exports = chaiJquery;
  } else if (typeof define === "function" && define.amd) {
    // AMD
    define(['jquery'], function ($) {
      return function (chai, utils) {
        return chaiJquery(chai, utils, $);
      };
    });
  } else {
    // Other environment (usually <script> tag): plug in to global chai instance directly.
    chai.use(function (chai, utils) {
      return chaiJquery(chai, utils, jQuery);
    });
  }
}(function (chai, utils, $) {
  var inspect = utils.inspect,
      flag = utils.flag;
  $ = $ || jQuery;

  var setPrototypeOf = '__proto__' in Object ?
    function (object, prototype) {
      object.__proto__ = prototype;
    } :
    function (object, prototype) {
      var excludeNames = /^(?:length|name|arguments|caller)$/;

      function copyProperties(dst, src) {
        Object.getOwnPropertyNames(src).forEach(function (name) {
          if (!excludeNames.test(name)) {
            Object.defineProperty(dst, name,
              Object.getOwnPropertyDescriptor(src, name));
          }
        });
      }

      copyProperties(object, prototype);
      copyProperties(object, Object.getPrototypeOf(prototype));
    };

  $.fn.inspect = function (depth) {
    if (this.length === 0) {
      return formatSelector(this);
    }
    var el = $('<div />').append(this.clone());
    if (depth !== undefined) {
      var children = el.children();
      while (depth-- > 0)
        children = children.children();
      children.html('...');
    }
    return el.html();
  };

  function formatSelector(obj) {
    return "$(\"" + obj.selector + "\")(length = " + obj.length +")";
  }

  function humanize(obj) {
    if(obj.selector) {
      return inspect(formatSelector(obj));
    } else {
      return inspect(obj);
    }
  }

  var props = {attr: 'attribute', css: 'CSS property', prop: 'property'};
  for (var prop in props) {
    (function (prop, description) {
      chai.Assertion.addMethod(prop, function (name, val) {
        var obj = flag(this, 'object');
        var actual = obj[prop](name);

        if (!flag(this, 'negate') || undefined === val) {
          this.assert(
              undefined !== actual
            , 'expected ' + humanize(obj) + ' to have a #{exp} ' + description
            , 'expected ' + humanize(obj) + ' not to have a #{exp} ' + description
            , name
          );
        }

        if (undefined !== val) {
          this.assert(
              val === actual
            , 'expected ' + humanize(obj) + ' to have a ' + inspect(name) + ' ' + description + ' with the value #{exp}, but the value was #{act}'
            , 'expected ' + humanize(obj) + ' not to have a ' + inspect(name) + ' ' + description + ' with the value #{act}'
            , val
            , actual
          );
        }

        flag(this, 'object', actual);
      });
    })(prop, props[prop]);
  }

  chai.Assertion.addMethod('data', function (name, val) {
    // Work around a chai bug (https://github.com/logicalparadox/chai/issues/16)
    if (flag(this, 'negate') && undefined !== val && undefined === flag(this, 'object').data(name)) {
      return;
    }

    var assertion = new chai.Assertion(flag(this, 'object').data());
    if (flag(this, 'negate'))
      assertion = assertion.not;
    return assertion.property(name, val);
  });

  chai.Assertion.addMethod('class', function (className) {
    var obj = flag(this, 'object');
    this.assert(
        flag(this, 'object').hasClass(className)
      , 'expected ' + humanize(obj) + ' to have class #{exp}'
      , 'expected ' + humanize(obj) + ' not to have class #{exp}'
      , className
    );
  });

  chai.Assertion.addMethod('id', function (id) {
    var obj = flag(this, 'object');
    this.assert(
        flag(this, 'object').attr('id') === id
      , 'expected ' + humanize(obj) + ' to have id #{exp}'
      , 'expected ' + humanize(obj) + ' not to have id #{exp}'
      , id
    );
  });

  chai.Assertion.addMethod('html', function (html) {
    var obj = flag(this, 'object');
    var actual = flag(this, 'object').html();
    this.assert(
        actual === html
      , 'expected ' + humanize(obj) + ' to have HTML #{exp}, but the HTML was #{act}'
      , 'expected ' + humanize(obj) + ' not to have HTML #{exp}'
      , html
      , actual
    );
  });

  chai.Assertion.addMethod('text', function (text) {
    var obj = flag(this, 'object');
    var actual = obj.text();
    this.assert(
        actual === text
      , 'expected ' + humanize(obj) + ' to have text #{exp}, but the text was #{act}'
      , 'expected ' + humanize(obj) + ' not to have text #{exp}'
      , text
      , actual
    );
  });

  chai.Assertion.addMethod('value', function (value) {
    var obj = flag(this, 'object');
    var actual = obj.val();
    this.assert(
        obj.val() === value
      , 'expected ' + humanize(obj) + ' to have value #{exp}, but the value was #{act}'
      , 'expected ' + humanize(obj) + ' not to have value #{exp}'
      , value
      , actual
    );
  });

  chai.Assertion.addMethod('descendants', function (selector) {
    var obj = flag(this, 'object');
    this.assert(
        obj.has(selector).length > 0
      , 'expected ' + humanize(obj) + ' to have #{exp}'
      , 'expected ' + humanize(obj) + ' not to have #{exp}'
      , selector
    );
  });

  $.each(['visible', 'hidden', 'selected', 'checked', 'enabled', 'disabled'], function (i, attr) {
    chai.Assertion.addProperty(attr, function () {
      var obj = flag(this, 'object');
      this.assert(
          obj.is(':' + attr)
        , 'expected ' + humanize(obj) + ' to be ' + attr
        , 'expected ' + humanize(obj) + ' not to be ' + attr);
    });
  });

  chai.Assertion.overwriteProperty('exist', function (_super) {
    return function () {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        this.assert(
            obj.length > 0
          , 'expected ' + humanize(obj) + ' to exist'
          , 'expected ' + humanize(obj) + ' not to exist');
      } else {
        _super.apply(this, arguments);
      }
    };
  });

  chai.Assertion.overwriteProperty('empty', function (_super) {
    return function () {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        this.assert(
          obj.is(':empty')
          , 'expected ' + humanize(obj) + ' to be empty'
          , 'expected ' + humanize(obj) + ' not to be empty');
      } else {
        _super.apply(this, arguments);
      }
    };
  });

  chai.Assertion.overwriteMethod('match', function (_super) {
    return function (selector) {
      var obj = flag(this, 'object');
      if (obj instanceof $) {
        this.assert(
            obj.is(selector)
          , 'expected #{this} to match #{exp}'
          , 'expected #{this} not to match #{exp}'
          , selector
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  });

  chai.Assertion.overwriteChainableMethod('contain',
    function (_super) {
      return function (text) {
        var obj = flag(this, 'object');
        if (obj instanceof $) {
          this.assert(
              obj.is(':contains(\'' + text + '\')')
            , 'expected #{this} to contain #{exp}'
            , 'expected #{this} not to contain #{exp}'
            , text);
        } else {
          _super.apply(this, arguments);
        }
      }
    },
    function(_super) {
      return function() {
        _super.call(this);
      };
    }
  );
}));
