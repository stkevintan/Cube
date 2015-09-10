import React from 'react'
import {Dropdown,Icon,Slider} from './component'

const loopDict = [
    {iconName:'refresh',name:'列表循环'},
    {iconName:'repeat',name:'单曲循环'},
    {iconName:'long-arrow-right',name:'顺序播放'},
    {iconName:'random',name:'随机播放'}
];
function timeStr(time) {
    if (isNaN(time)) return '??:??';
    var m = Math.floor(time / 60);
    var s = Math.floor(time) % 60;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return m + ':' + s;
  }
export const Footer = React.createClass({
    onPlayTrackChange:function(){
        console.log('play track change');
    },
    onPlayTrackUpdate:function(scale){
        this.state.curTime = scale * this.state.duration;
        this.setState(this.state);
    },
    onPlayIconClick:function(){
        if(this.state.playState==='PLAYING') this.state.playState='PAUSED';
        else this.state.playState='PLAYING';
        this.setState(this.state);
    },
    getInitialState:() => ({playState:'PAUSED',duration:10,curTime:0}),
    getDefaultProps:() => ({loopMode:0}),
    render:function(){
        let playIcon = this.state.playState=='PAUSED'?'play':'pause';
        let MenuItems = loopDict.map((item,index) => <li key = {index}>
            <Icon iconName = {item.iconName} />
            {item.name}
        </li>);
        return <div className='container-flow'>
                <a href="javascript:0" className="media playinfo">
                    <Icon iconName='angle-double-up' />
                    <Icon iconName='angle-double-up' />
                    <img src="assets/img/album.png" />
                    <h1 className="media-body title txt">Music Box Dancer</h1>
                </a>
                <div data-curtime={timeStr(this.state.curTime)} data-duration={timeStr(this.state.duration)} className="playtrack">
                    <Slider onChange={this.onPlayTrackChange} onUpdate={this.onPlayTrackUpdate} />
                </div>
                <ul className='list-inline playset'>
                    <li><Icon iconName='step-backward' /></li>
                    <li onClick={this.onPlayIconClick}><Icon iconName = {playIcon} /></li>
                    <li><Icon iconName = 'step-forward' /></li>
                    <li><Dropdown>
                        <ul className='list-menu'>{MenuItems}</ul>
                        <Icon iconName={loopDict[this.props.loopMode].iconName} />
                    </Dropdown></li>
                    <li className='volume'><Dropdown>
                        <div className='voltrack'><Slider dir='vertial' /></div>
                        <Icon iconName='volume-up' />
                    </Dropdown></li>
                    <li><Icon iconName='sliders' /></li>
                </ul>
            </div>
    }
});
