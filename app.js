(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var process;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("initialize.js", function(exports, require, module) {
'use strict';

var _size2 = require('lodash/size');

var _size3 = _interopRequireDefault(_size2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _min2 = require('lodash/min');

var _min3 = _interopRequireDefault(_min2);

var _max2 = require('lodash/max');

var _max3 = _interopRequireDefault(_max2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _get2 = require('lodash/get');

var _get3 = _interopRequireDefault(_get2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _values2 = require('lodash/values');

var _values3 = _interopRequireDefault(_values2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _reselect = require('reselect');

var _reactDom = require('react-dom');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Badge = require('react-bootstrap/lib/Badge');

var _Badge2 = _interopRequireDefault(_Badge);

var _FormControl = require('react-bootstrap/lib/FormControl');

var _FormControl2 = _interopRequireDefault(_FormControl);

var _Nav = require('react-bootstrap/lib/Nav');

var _Nav2 = _interopRequireDefault(_Nav);

var _NavItem = require('react-bootstrap/lib/NavItem');

var _NavItem2 = _interopRequireDefault(_NavItem);

var _Panel = require('react-bootstrap/lib/Panel');

var _Panel2 = _interopRequireDefault(_Panel);

var _reactVirtualized = require('react-virtualized');

var _reactList = require('react-list');

var _reactList2 = _interopRequireDefault(_reactList);

var _reactScrollUp = require('react-scroll-up');

var _reactScrollUp2 = _interopRequireDefault(_reactScrollUp);

var _fuse = require('fuse.js');

var _fuse2 = _interopRequireDefault(_fuse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* globals $,moment */


var DATE_FORMAT = 'DD/MM/YYYY';
var scoreAdjustment = {
  yes: 1,
  no: 1,
  opposite: -1,
  novote: 0
};

var fuseSelector = (0, _reselect.createSelector)(function (state) {
  return state.data.motions;
}, function (motions) {
  return new _fuse2.default((0, _values3.default)(motions), { keys: ['title'] });
});

var filterMotionsSelector = (0, _reselect.createSelector)(function (state) {
  return state.data.motions;
}, function (state) {
  return state.startDate;
}, function (state) {
  return state.endDate;
}, function (state) {
  return state.filterText;
}, fuseSelector, function (motions, startDate, endDate, filterText, fuse) {
  var searchResult = (0, _isEmpty3.default)(filterText) ? motions : fuse.search(filterText);
  var filteredMotions = (0, _filter3.default)(searchResult, function (motion) {
    return motion.voteDateMoment.isBetween(startDate, endDate);
  });
  return filteredMotions;
});

var votedMotionsSelector = (0, _reselect.createSelector)(function (state) {
  return state.data.motions;
}, function (state) {
  return state.voted;
}, function (motions, voted) {
  return (0, _filter3.default)(motions, function (motion) {
    return (0, _get3.default)(voted, [motion.id]);
  });
});

var getOppositeVote = function getOppositeVote(vote) {
  return {
    'yes': 'no',
    'no': 'yes'
  }[vote];
};

var matchResultSelector = (0, _reselect.createSelector)(function (state) {
  return state.data.motions;
}, function (state) {
  return state.voted;
}, function (state) {
  return state.data.members;
}, function (motions, voted, members) {
  return (0, _sortBy3.default)((0, _map3.default)(members, function (member, memberName) {
    var matching = (0, _reduce3.default)(voted, function (r, vote, motionId) {
      var memberVote = member.votes[motionId];
      if (memberVote === vote) {
        r.score += scoreAdjustment[vote];
        r[vote] += 1;
      } else if (memberVote === getOppositeVote(vote)) {
        r.score += scoreAdjustment['opposite'];
        r['opposite'] += 1;
      } else if (memberVote) {
        r.score += scoreAdjustment['novote'];
        r['novote'] += 1;
        r[memberVote] += 1;
      }
      return r;
    }, {
      yes: 0,
      no: 0,
      opposite: 0,
      novote: 0,
      absent: 0,
      present: 0,
      abstain: 0,
      score: 0
    });
    return {
      name: memberName,
      matching: matching
    };
  }), function (x) {
    return x.matching.score * -1;
  });
});

var motionDatesSelector = (0, _reselect.createSelector)(function (state) {
  return state.data.motions;
}, function (motions) {
  return (0, _map3.default)(motions, 'voteDateMoment');
});

var maxDateSelector = (0, _reselect.createSelector)(motionDatesSelector, function (motionDates) {
  return (0, _max3.default)(motionDates);
});

var minDateSelector = (0, _reselect.createSelector)(motionDatesSelector, function (motionDates) {
  return (0, _min3.default)(motionDates);
});

var DateRangeFilter = function (_Component) {
  _inherits(DateRangeFilter, _Component);

  function DateRangeFilter() {
    _classCallCheck(this, DateRangeFilter);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(DateRangeFilter).apply(this, arguments));
  }

  _createClass(DateRangeFilter, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      $(this._input).daterangepicker(_extends({
        autoApply: true,
        locale: {
          format: DATE_FORMAT
        }
      }, (0, _pick3.default)(this.props, ['startDate', 'endDate', 'minDate', 'maxDate']))).on('apply.daterangepicker', this.props.onApply);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return _react2.default.createElement('input', {
        ref: function ref(c) {
          return _this2._input = c;
        },
        type: 'text',
        name: 'datefilter',
        className: 'form-control'
      });
    }
  }]);

  return DateRangeFilter;
}(_react.Component);

var renderMotionVote = function renderMotionVote(_ref) {
  var motions = _ref.motions;
  var voted = _ref.voted;
  var onVoteYes = _ref.onVoteYes;
  var onVoteNo = _ref.onVoteNo;
  return function (i) {
    var motion = motions[i];
    return _react2.default.createElement(
      'div',
      { key: i, className: 'form-group list-group-item lead' },
      _react2.default.createElement(
        'h4',
        { className: 'list-group-item-heading' },
        motion.title,
        _react2.default.createElement(
          'div',
          { style: { textAlign: 'right' } },
          _react2.default.createElement(
            'small',
            null,
            '投票日期：',
            motion.voteDate
          )
        )
      ),
      _react2.default.createElement(
        'label',
        { className: 'radio-inline' },
        _react2.default.createElement('input', {
          type: 'radio',
          name: motion.id,
          value: 'yes',
          onChange: function onChange() {
            return onVoteYes(motion);
          },
          checked: (0, _get3.default)(voted, motion.id) === 'yes'
        }),
        ' 贊成'
      ),
      _react2.default.createElement(
        'label',
        { className: 'radio-inline' },
        _react2.default.createElement('input', {
          type: 'radio',
          name: motion.id,
          value: 'no',
          onChange: function onChange() {
            return onVoteNo(motion);
          },
          checked: (0, _get3.default)(voted, motion.id) === 'no'
        }),
        ' 反對'
      )
    );
  };
};

var VoteSectionHeader = function VoteSectionHeader(_ref2) {
  var activeTab = _ref2.activeTab;
  var onSelectTab = _ref2.onSelectTab;
  var votedCount = _ref2.votedCount;

  return _react2.default.createElement(
    'header',
    null,
    _react2.default.createElement(
      'h2',
      null,
      '議案投票'
    ),
    _react2.default.createElement(
      'p',
      { className: 'lead' },
      '假如你是立法會議員，你會如何投票？'
    ),
    _react2.default.createElement(
      _Nav2.default,
      { bsStyle: 'tabs', activeKey: activeTab, onSelect: onSelectTab },
      _react2.default.createElement(
        _NavItem2.default,
        { eventKey: 1 },
        '選取議案'
      ),
      votedCount > 0 && [_react2.default.createElement(
        _NavItem2.default,
        { key: 2, eventKey: 2 },
        '你的投票 ',
        _react2.default.createElement(
          _Badge2.default,
          null,
          votedCount
        )
      ), _react2.default.createElement(
        _NavItem2.default,
        { key: 3, eventKey: 3 },
        '配對結果'
      )]
    )
  );
};

var ElectionMatch = function (_React$Component) {
  _inherits(ElectionMatch, _React$Component);

  function ElectionMatch(props) {
    _classCallCheck(this, ElectionMatch);

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(ElectionMatch).call(this, props));

    _this3.state = {
      activeTab: 1,
      filterText: ''
    };
    return _this3;
  }

  _createClass(ElectionMatch, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this4 = this;

      $.getJSON('data.json', function (data) {
        (0, _each3.default)(data.motions, function (motion, motionId) {
          motion.id = motionId;
          motion.group = motion.meetingType + ' - ' + motion.voteDate;
          motion.voteDateMoment = moment(motion.voteDate, DATE_FORMAT);
        });

        _this4.setState({
          data: data,
          startDate: minDateSelector({ data: data }),
          endDate: maxDateSelector({ data: data })
        });
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this5 = this;

      var _state = this.state;
      var data = _state.data;
      var activeTab = _state.activeTab;
      var voted = _state.voted;

      if (!data) {
        return _react2.default.createElement(
          'div',
          null,
          '載入議案資料中⋯⋯'
        );
      }
      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'section',
          null,
          _react2.default.createElement(VoteSectionHeader, {
            activeTab: activeTab,
            onSelectTab: function onSelectTab(eventKey) {
              return _this5.setState({ activeTab: eventKey });
            },
            votedCount: (0, _size3.default)(voted)
          }),
          [this.renderFilterVotesTab(), this.renderSelectedVotesTab(), this.renderResultTab()][activeTab - 1]
        ),
        _react2.default.createElement(
          _reactScrollUp2.default,
          { showUnder: 160 },
          _react2.default.createElement(
            'span',
            null,
            '移至頂部'
          )
        )
      );
    }
  }, {
    key: 'renderFilterVotesTab',
    value: function renderFilterVotesTab() {
      var _this6 = this;

      var _state2 = this.state;
      var data = _state2.data;
      var voted = _state2.voted;
      var startDate = _state2.startDate;
      var endDate = _state2.endDate;

      var motions = filterMotionsSelector(this.state);
      return _react2.default.createElement(
        _Panel2.default,
        null,
        _react2.default.createElement(
          'p',
          { className: 'lead' },
          '共 ',
          (0, _size3.default)(data.motions),
          ' 個議案，最近更新：',
          maxDateSelector(this.state).format(DATE_FORMAT),
          '。'
        ),
        _react2.default.createElement(DateRangeFilter, {
          minDate: minDateSelector(this.state),
          maxDate: maxDateSelector(this.state),
          startDate: startDate,
          endDate: endDate,
          onApply: function onApply(ev, picker) {
            _this6.setState({
              startDate: picker.startDate,
              endDate: picker.endDate
            });
          }
        }),
        _react2.default.createElement(_FormControl2.default, {
          type: 'text',
          placeholder: '輸入關鍵字篩選',
          value: this.state.filterText,
          onChange: function onChange(event) {
            return _this6.setState({ filterText: event.target.value });
          }
        }),
        (0, _isEmpty3.default)(motions) ? _react2.default.createElement(
          'p',
          { className: 'text-warning' },
          '沒有議案可投票'
        ) : _react2.default.createElement(_reactList2.default, {
          itemRenderer: renderMotionVote({
            motions: motions,
            voted: voted,
            onVoteYes: this.onVote('yes'),
            onVoteNo: this.onVote('no')
          }),
          length: motions.length,
          type: 'simple'
        })
      );
    }
  }, {
    key: 'renderSelectedVotesTab',
    value: function renderSelectedVotesTab() {
      var voted = this.state.voted;

      var motions = votedMotionsSelector(this.state);
      return _react2.default.createElement(
        'div',
        null,
        (0, _isEmpty3.default)(motions) ? _react2.default.createElement(
          'p',
          { className: 'text-warning' },
          '未有投票'
        ) : _react2.default.createElement(_reactList2.default, {
          itemRenderer: renderMotionVote({
            motions: motions,
            voted: voted,
            onVoteYes: this.onVote('yes'),
            onVoteNo: this.onVote('no')
          }),
          length: motions.length,
          type: 'simple'
        })
      );
    }
  }, {
    key: 'renderResultTab',
    value: function renderResultTab() {
      var matchResult = matchResultSelector(this.state);
      return _react2.default.createElement(
        'div',
        { className: 'table-responsive' },
        _react2.default.createElement(
          'table',
          { className: 'table table-striped table-hover table-condensed' },
          _react2.default.createElement(
            'thead',
            null,
            _react2.default.createElement(
              'tr',
              null,
              _react2.default.createElement(
                'th',
                null,
                '議員'
              ),
              _react2.default.createElement(
                'th',
                null,
                '相似分數'
              ),
              _react2.default.createElement(
                'th',
                null,
                '相同投票'
              ),
              _react2.default.createElement(
                'th',
                null,
                '相反投票'
              ),
              _react2.default.createElement(
                'th',
                null,
                '相同贊成'
              ),
              _react2.default.createElement(
                'th',
                null,
                '相同反對'
              ),
              _react2.default.createElement(
                'th',
                null,
                '沒有表態'
              )
            )
          ),
          _react2.default.createElement(
            'tbody',
            null,
            (0, _map3.default)(matchResult, function (member, i) {
              return _react2.default.createElement(
                'tr',
                { key: i },
                _react2.default.createElement(
                  'td',
                  null,
                  member.name
                ),
                _react2.default.createElement(
                  'td',
                  null,
                  member.matching.score
                ),
                _react2.default.createElement(
                  'td',
                  null,
                  member.matching.yes + member.matching.no
                ),
                _react2.default.createElement(
                  'td',
                  null,
                  member.matching.opposite
                ),
                _react2.default.createElement(
                  'td',
                  null,
                  member.matching.yes
                ),
                _react2.default.createElement(
                  'td',
                  null,
                  member.matching.no
                ),
                _react2.default.createElement(
                  'td',
                  null,
                  member.matching.novote
                )
              );
            })
          )
        )
      );
    }
  }, {
    key: 'onVote',
    value: function onVote(vote) {
      var _this7 = this;

      return function (motion) {
        var voted = _this7.state.voted;

        _this7.setState({ voted: _extends({}, voted, _defineProperty({}, motion.id, vote)) });
      };
    }
  }]);

  return ElectionMatch;
}(_react2.default.Component);

document.addEventListener('DOMContentLoaded', function () {
  (0, _reactDom.render)(_react2.default.createElement(ElectionMatch, null), document.getElementById('app'));
});
});

;require.alias("lodash/lodash.js", "lodash");
require.alias("reselect/lib/index.js", "reselect");
require.alias("react/react.js", "react");
require.alias("react-bootstrap/lib/index.js", "react-bootstrap");
require.alias("react-virtualized/dist/commonjs/index.js", "react-virtualized");
require.alias("react-list/react-list.js", "react-list");
require.alias("fuse.js/src/fuse.js", "fuse.js");
require.alias("process/browser.js", "process");
require.alias("base64-js/lib/b64.js", "base64-js");
require.alias("performance-now/lib/performance-now.js", "performance-now");
require.alias("react-prop-types/lib/index.js", "react-prop-types");
require.alias("warning/browser.js", "warning");
require.alias("invariant/browser.js", "invariant");
require.alias("react-overlays/lib/index.js", "react-overlays");
require.alias("buffer/index.js", "buffer");process = require('process');require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map