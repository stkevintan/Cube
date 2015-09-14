'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var prevent = function prevent(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
    }
};
var nowOpenedDropdown = null;
//事件委托
document.addEventListener('click', function (e) {
    var stack = e.path,
        target;
    for (var i = 0; i < stack.length - 1; i++) {
        // no need to check document
        if (stack[i].classList && stack[i].classList.contains('dropdown')) {
            target = stack[i];
            break;
        }
    }
    if (target == nowOpenedDropdown) return;
    if (nowOpenedDropdown) {
        nowOpenedDropdown.classList.remove('open');
        nowOpenedDropdown = null;
    }
    if (target) {
        target.classList.add('open');
        nowOpenedDropdown = target;
    }
});
var Dropdown = _react2['default'].createClass({
    displayName: 'Dropdown',

    getInitialState: function getInitialState() {
        return { opened: false };
    },
    getDefaultProps: function getDefaultProps() {
        return { instant: false };
    },
    componentDidMount: function componentDidMount() {},
    render: function render() {
        var _props$children = _toArray(this.props.children);

        var content = _props$children[0];

        var children = _props$children.slice(1);

        return _react2['default'].createElement(
            'div',
            { className: 'dropdown' },
            _react2['default'].createElement(
                'div',
                { ref: 'content', className: 'content arrow arrow-down' },
                content
            ),
            children
        );
    }
});

exports.Dropdown = Dropdown;
var Icon = _react2['default'].createClass({
    displayName: 'Icon',

    PropTypes: {
        iconName: _react2['default'].PropTypes.string.isRequired
    },
    render: function render() {
        return _react2['default'].createElement('i', { className: this.props.className + ' fa fa-' + this.props.iconName });
    }
});
exports.Icon = Icon;
var Slider = _react2['default'].createClass({
    displayName: 'Slider',

    propTypes: {
        dir: _react2['default'].PropTypes.oneOf(['vertial', 'horizon']),
        onChange: _react2['default'].PropTypes.func,
        onUpdate: _react2['default'].PropTypes.func
    },
    getDefaultProps: function getDefaultProps() {
        var emptyFunc = new Function();
        return {
            dir: 'horizon',
            onChange: emptyFunc,
            onUpdate: emptyFunc
        };
    },
    getInitialState: function getInitialState() {
        return { scale: 0 };
    },
    startMovingThumb: function startMovingThumb(e) {
        console.log('start moving');
        prevent(e);
        if (e.which == 1) {
            this.getDOMNode().classList.add('noAnimate');
            this.setThumb(e);
            document.addEventListener('mousemove', this.movingThumb);
            document.addEventListener('mouseup', this.stopMovingThumb);
        }
    },
    setThumb: function setThumb(e, finish) {
        var rect = this.getDOMNode().getBoundingClientRect();
        var scale = 0;
        if (this.dir == 'vertial') scale = 1 - (e.clientY - rect.bottom) / rect.height;else scale = (e.clientX - rect.left) / rect.width;
        //update state
        if (scale < 0) scale = 0;else if (scale > 1) scale = 1;
        this.setState({ scale: scale });
        this.props.onUpdate(scale);
        if (finish) this.props.onChange(scale);
    },
    movingThumb: function movingThumb(e) {
        prevent(e);
        this.setThumb(e);
    },
    stopMovingThumb: function stopMovingThumb(e) {
        prevent(e);
        this.setThumb(e, true);
        this.getDOMNode().classList.remove('noAnimate');
        document.removeEventListener('mousemove', this.movingThumb);
        document.removeEventListener('mouseup', this.stopMovingThumb);
    },
    componentDidMount: function componentDidMount() {
        this.getDOMNode().addEventListener('mousedown', this.startMovingThumb);
    },
    render: function render() {
        var scale = this.state.scale;
        if (this.props.dir === 'horizon') scale = { width: scale * 100 + '%' };else scale = { height: scale * 100 + '%' };
        return _react2['default'].createElement(
            'div',
            { className: 'track ' + this.props.dir },
            this.props.children,
            _react2['default'].createElement('div', { refs: 'trackCover', className: 'track-cover', style: scale })
        );
    }
});
exports.Slider = Slider;
var Media = _react2['default'].createClass({
    displayName: 'Media',

    render: function render() {
        return _react2['default'].createElement(
            'div',
            { className: this.props.className + ' media' },
            _react2['default'].createElement('img', { src: this.props.imgUrl }),
            _react2['default'].createElement(
                'div',
                { className: 'media-body' },
                this.props.children
            )
        );
    }
});
exports.Media = Media;
var Button = _react2['default'].createClass({
    displayName: 'Button',

    render: function render() {
        return _react2['default'].createElement(
            'a',
            { className: this.props.className + ' button ' + (this.props.active ? 'active' : null) },
            this.props.children
        );
    }
});
exports.Button = Button;