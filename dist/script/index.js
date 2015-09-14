'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _ipc = require('ipc');

var _ipc2 = _interopRequireDefault(_ipc);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _scriptBody = require('./script/body');

var _scriptFooter = require('./script/footer');

window.onload = function () {
    _ipc2['default'].send('load-source');
    var activeEntry = 1;
    _react2['default'].render(_react2['default'].createElement(_scriptBody.Body, { active: activeEntry }), document.querySelector('#body'));
    _react2['default'].render(_react2['default'].createElement(_scriptFooter.Footer, null), document.querySelector('#footer'));
};