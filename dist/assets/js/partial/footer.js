var React = require('react');
var Slider = require('../widget/slider');
var InlineList = require('../widget/inlineList');
var Dropdown = require('../widget/dropdown');
var MenuList =require('../widget/menuList');
var Icon = require('../widget/icon');
var loopDict = [
    {iconName:'refresh',name:'列表循环'},
    {iconName:'repeat',name:'单曲循环'},
    {iconName:'long-arrow-right',name:'顺序播放'},
    {iconName:'random',name:'随机播放'}
];
module.exports = React.createClass({displayName: "exports",
    onPlayTrackChange:function(){
        console.log('play track change');
    },
    getInitialState:function(){
        return {playState:'PAUSED'};
    },
    getDefaultProps:function(){
        return {loopMode:0}
    },
    render:function(){
        var playIcon = this.state.playState=='PAUSED'?'play':'pause';
        var loopPanel = React.createElement(MenuList, {items: 
            loopDict.map(function(item){
                return [React.createElement(Icon, {iconName: item.iconName}),React.createElement("span", null, item.name)]
            })
        })
        var volPanel = React.createElement("div", {className: "voltrack"}, 
            React.createElement(Slider, {dir: "vertial"})
        )
        var playset = [
            React.createElement(Icon, {iconName: "step-backward"}),
            React.createElement(Icon, {iconName: playIcon}),
            React.createElement(Icon, {iconName: "step-forward"}),
            React.createElement(Dropdown, {content: loopPanel}, 
                React.createElement(Icon, {iconName: loopDict[this.props.loopMode].iconName})
            ),
            React.createElement(Dropdown, {content: volPanel}, 
                React.createElement(Icon, {iconName: "volume-up"})
            ),
            React.createElement(Icon, {iconName: "sliders"})
        ];
        return React.createElement("div", null, 
            React.createElement("a", {href: "javascript:0", className: "media playinfo"}, 
                React.createElement(Icon, {iconName: "angle-double-up"}), 
                React.createElement(Icon, {iconName: "angle-double-up"}), 
                React.createElement("img", {src: "assets/img/album.png"}), 
                React.createElement("h1", {className: "media-body title txt"}, "Music Box Dancer")
            ), 
            React.createElement("div", {"data-curtime": "00:00", "data-duration": "00:10", className: "playtrack"}, 
                React.createElement(Slider, {onChnage: this.onPlayTrackChange})
            ), 
            React.createElement(InlineList, {className: "playset", items: playset})
        )
    }
});
