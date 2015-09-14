'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ipc = require('ipc');

var _ipc2 = _interopRequireDefault(_ipc);

var _component = require('./component');

var View = _react2['default'].createClass({
    displayName: 'View',

    getInitialState: function getInitialState() {
        return {};
    },
    componentDidMount: function componentDidMount() {
        var _this = this;

        _ipc2['default'].on('source-loaded', function (key, source) {
            _this.state[key] = source;
            _this.setState(_this.state);
        });
    },
    render: function render() {
        var inner = [];
        for (var key in this.state) {
            var source = this.state[key];
            for (var i = 0; i < source.entryList.length; i++) {
                var entry = source.entryList[i];
                inner.push(_react2['default'].createElement(
                    'section',
                    { className: 'view-playlist slim-scrollbar' },
                    _react2['default'].createElement(
                        _component.Media,
                        { className: 'playlist-intro panel', imgUrl: 'assets/img/album.png' },
                        _react2['default'].createElement(
                            'ul',
                            { className: 'list-prefix playlist-desc' },
                            _react2['default'].createElement(
                                'li',
                                { 'data-item': '歌单名' },
                                entry.name
                            ),
                            _react2['default'].createElement(
                                'li',
                                { 'data-item': '创造者' },
                                entry.creator
                            ),
                            _react2['default'].createElement(
                                'li',
                                { 'data-item': '描述' },
                                entry.desc
                            )
                        )
                    ),
                    _react2['default'].createElement(
                        'div',
                        { className: 'playlist panel' },
                        _react2['default'].createElement(
                            'div',
                            { className: 'container-row heading' },
                            _react2['default'].createElement(
                                'h1',
                                { className: 'left title txt' },
                                '歌曲列表'
                            ),
                            _react2['default'].createElement(
                                'div',
                                { className: 'right btn-group playlist-display' },
                                _react2['default'].createElement(
                                    _component.Button,
                                    { active: true },
                                    _react2['default'].createElement(_component.Icon, { iconName: 'list' })
                                ),
                                _react2['default'].createElement(
                                    _component.Button,
                                    null,
                                    _react2['default'].createElement(_component.Icon, { iconName: 'th' })
                                )
                            )
                        ),
                        _react2['default'].createElement(
                            'table',
                            { className: 'stripe index playlist-content' },
                            _react2['default'].createElement(
                                'thead',
                                null,
                                _react2['default'].createElement(
                                    'tr',
                                    null,
                                    _react2['default'].createElement(
                                        'th',
                                        { className: 'index' },
                                        '#'
                                    ),
                                    _react2['default'].createElement(
                                        'th',
                                        { className: 'title' },
                                        '标题'
                                    ),
                                    _react2['default'].createElement(
                                        'th',
                                        { className: 'time' },
                                        '时长'
                                    ),
                                    _react2['default'].createElement(
                                        'th',
                                        { className: 'artist' },
                                        '歌手'
                                    ),
                                    _react2['default'].createElement(
                                        'th',
                                        { className: 'album' },
                                        '专辑'
                                    )
                                )
                            ),
                            _react2['default'].createElement(
                                'tbody',
                                null,
                                entry.songList.map(function (song) {
                                    return _react2['default'].createElement(
                                        'tr',
                                        null,
                                        _react2['default'].createElement(
                                            'td',
                                            { className: 'index' },
                                            _react2['default'].createElement(_component.Icon, { iconName: 'music', className: 'active' }),
                                            _react2['default'].createElement(_component.Icon, { iconName: 'play', className: 'hint' })
                                        ),
                                        _react2['default'].createElement(
                                            'td',
                                            { className: 'title' },
                                            song.name
                                        ),
                                        _react2['default'].createElement(
                                            'td',
                                            { className: 'time' },
                                            song.duration
                                        ),
                                        _react2['default'].createElement(
                                            'td',
                                            { className: 'artist' },
                                            song.artist
                                        ),
                                        _react2['default'].createElement(
                                            'td',
                                            { className: 'album' },
                                            song.album
                                        )
                                    );
                                })
                            )
                        )
                    )
                ));
            }
        }
        return _react2['default'].createElement(
            'div',
            { className: 'view' },
            inner
        );
    }
});
exports.View = View;