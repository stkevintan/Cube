'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ipc = require('ipc');

var _ipc2 = _interopRequireDefault(_ipc);

var EntryTool = _react2['default'].createClass({
    displayName: 'EntryTool',

    render: function render() {
        var inner = undefined;
        if (this.props.type === 'entry') inner = ['plus', 'pencil', 'trash'];else inner = ['plus', 'refresh'];
        return _react2['default'].createElement(
            'div',
            { className: 'tools' },
            inner.map(function (name, index) {
                return _react2['default'].createElement(
                    'a',
                    { key: index, href: 'javascript:0' },
                    _react2['default'].createElement('i', { className: 'fa fa-' + name })
                );
            })
        );
    }
});

var Entry = _react2['default'].createClass({
    displayName: 'Entry',

    render: function render() {
        return _react2['default'].createElement(
            'li',
            { id: this.props.key },
            _react2['default'].createElement(
                'a',
                { href: 'javascript:0', className: 'txt' },
                this.props.data.name
            ),
            _react2['default'].createElement(EntryTool, { type: 'entry' })
        );
    }
});

var Source = _react2['default'].createClass({
    displayName: 'Source',

    render: function render() {
        var _this = this;

        return _react2['default'].createElement(
            'div',
            { className: 'source' },
            _react2['default'].createElement(
                'div',
                { className: 'head' },
                _react2['default'].createElement(
                    'h4',
                    { className: 'txt' },
                    this.props.data.name
                ),
                _react2['default'].createElement(EntryTool, { type: 'head' })
            ),
            _react2['default'].createElement(
                'ol',
                { className: 'entries' },
                this.props.data.entryList.map(function (entry, index) {
                    var key = _this.props.id + '_' + index;
                    return _react2['default'].createElement(Entry, { key: key, id: key, data: entry });
                })
            )
        );
    }
});

var Sidebar = _react2['default'].createClass({
    displayName: 'Sidebar',

    getInitialState: function getInitialState() {
        return {};
    },
    componentDidMount: function componentDidMount() {
        var _this2 = this;

        _ipc2['default'].on('source-loaded', function (key, source) {
            _this2.state[key] = source;
            _this2.setState(_this2.state);
        });
    },
    render: function render() {
        var inner = [];
        for (var key in this.state) {
            inner.push(_react2['default'].createElement(Source, { key: key, id: key, data: this.state[key] }));
        }
        return _react2['default'].createElement(
            'div',
            null,
            inner
        );
    }
});
exports.Sidebar = Sidebar;