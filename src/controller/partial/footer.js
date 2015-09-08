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
module.exports = React.createClass({
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
        var loopPanel = <MenuList items={
            loopDict.map(function(item){
                return [<Icon iconName = {item.iconName} />,<span>{item.name}</span>]
            })
        } />
        var volPanel = <div className='voltrack'>
            <Slider dir='vertial' />
        </div>
        var playset = [
            <Icon iconName='step-backward' />,
            <Icon iconName = {playIcon} />,
            <Icon iconName = 'step-forward' />,
            <Dropdown content={loopPanel}>
                <Icon iconName={loopDict[this.props.loopMode].iconName} />
            </Dropdown>,
            <Dropdown content={volPanel}>
                <Icon iconName='volume-up' />
            </Dropdown>,
            <Icon iconName='sliders' />
        ];
        return <div>
            <a href="javascript:0" className="media playinfo">
                <Icon iconName='angle-double-up' />
                <Icon iconName='angle-double-up' />
                <img src="assets/img/album.png" />
                <h1 className="media-body title txt">Music Box Dancer</h1>
            </a>
            <div data-curtime="00:00" data-duration="00:10" className="playtrack">
                <Slider onChnage={this.onPlayTrackChange} />
            </div>
            <InlineList className='playset' items = {playset}/>
        </div>
    }
});
