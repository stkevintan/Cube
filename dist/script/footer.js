'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _component = require('./component');

var loopDict = [{ iconName: 'refresh', name: '列表循环' }, { iconName: 'repeat', name: '单曲循环' }, { iconName: 'long-arrow-right', name: '顺序播放' }, { iconName: 'random', name: '随机播放' }];
function timeStr(time) {
    if (isNaN(time)) return '??:??';
    var m = Math.floor(time / 60);
    var s = Math.floor(time) % 60;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return m + ':' + s;
}
var Footer = _react2['default'].createClass({
    displayName: 'Footer',

    onPlayTrackChange: function onPlayTrackChange() {
        console.log('play track change');
    },
    onPlayTrackUpdate: function onPlayTrackUpdate(scale) {
        this.state.curTime = scale * this.state.duration;
        this.setState(this.state);
    },
    onPlayIconClick: function onPlayIconClick() {
        if (this.state.playState === 'PLAYING') this.state.playState = 'PAUSED';else this.state.playState = 'PLAYING';
        this.setState(this.state);
    },
    getInitialState: function getInitialState() {
        return { playState: 'PAUSED', duration: 10, curTime: 0 };
    },
    getDefaultProps: function getDefaultProps() {
        return { loopMode: 0 };
    },
    render: function render() {
        var playIcon = this.state.playState == 'PAUSED' ? 'play' : 'pause';
        var MenuItems = loopDict.map(function (item, index) {
            return _react2['default'].createElement(
                'li',
                { key: index },
                _react2['default'].createElement(_component.Icon, { iconName: item.iconName }),
                item.name
            );
        });
        return _react2['default'].createElement(
            'div',
            { className: 'container-flow' },
            _react2['default'].createElement(
                _component.Media,
                { className: 'clickable playinfo', imgUrl: 'assets/img/album.png' },
                _react2['default'].createElement(_component.Icon, { iconName: 'angle-double-up' }),
                _react2['default'].createElement(_component.Icon, { iconName: 'angle-double-up' }),
                _react2['default'].createElement(
                    'h1',
                    { className: 'title txt' },
                    'Music Box Dancer'
                )
            ),
            _react2['default'].createElement(
                'div',
                { 'data-curtime': timeStr(this.state.curTime), 'data-duration': timeStr(this.state.duration), className: 'playtrack' },
                _react2['default'].createElement(_component.Slider, { onChange: this.onPlayTrackChange, onUpdate: this.onPlayTrackUpdate })
            ),
            _react2['default'].createElement(
                'ul',
                { className: 'list-inline playset' },
                _react2['default'].createElement(
                    'li',
                    null,
                    _react2['default'].createElement(_component.Icon, { iconName: 'step-backward' })
                ),
                _react2['default'].createElement(
                    'li',
                    { onClick: this.onPlayIconClick },
                    _react2['default'].createElement(_component.Icon, { iconName: playIcon })
                ),
                _react2['default'].createElement(
                    'li',
                    null,
                    _react2['default'].createElement(_component.Icon, { iconName: 'step-forward' })
                ),
                _react2['default'].createElement(
                    'li',
                    null,
                    _react2['default'].createElement(
                        _component.Dropdown,
                        null,
                        _react2['default'].createElement(
                            'ul',
                            { className: 'list-menu' },
                            MenuItems
                        ),
                        _react2['default'].createElement(_component.Icon, { iconName: loopDict[this.props.loopMode].iconName })
                    )
                ),
                _react2['default'].createElement(
                    'li',
                    { className: 'volume' },
                    _react2['default'].createElement(
                        _component.Dropdown,
                        null,
                        _react2['default'].createElement(
                            'div',
                            { className: 'voltrack' },
                            _react2['default'].createElement(_component.Slider, { dir: 'vertial' })
                        ),
                        _react2['default'].createElement(_component.Icon, { iconName: 'volume-up' })
                    )
                ),
                _react2['default'].createElement(
                    'li',
                    null,
                    _react2['default'].createElement(_component.Icon, { iconName: 'sliders' })
                )
            )
        );
    }
});
exports.Footer = Footer;