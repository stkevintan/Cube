'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _sidebar = require('./sidebar');

var _view = require('./view');

var Body = _react2['default'].createClass({
    displayName: 'Body',

    render: function render() {
        return _react2['default'].createElement(
            'div',
            { style: { height: '100%' } },
            _react2['default'].createElement(_sidebar.Sidebar, { active: this.props.active }),
            _react2['default'].createElement(_view.View, { active: this.props.active })
        );
    }
});
exports.Body = Body;