import React from 'react'
var prevent = function(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
    e.stopPropagation();
  }
}
document.querySelector('#body .main').onClick=()=>console.log('click main');
export var Dropdown = React.createClass({
    getInitialState:() => ({opened:false}),
    getDefaultProps:() => ({instant:false}),
    componentDidMount:function(){
        this.hide();
        this.getDOMNode().addEventListener('click',this.onClickDropdown);
        this.refs.content.getDOMNode().addEventListener('click',this.onClickContent);
    },
    hide:function(){
        this.state.opened=false;
        this.setState(this.state);
        document.removeEventListener('click',this.hide);
    },
    show:function(){
        this.state.opened=true;
        this.setState(this.state);
        document.addEventListener('click',this.hide);
    },
    onClickDropdown:function(e){
        prevent(e);
        console.log('click dropdown',e.path);
        document.dispatchEvent(new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': true
        }));
        this.show();
    },
    onClickContent:function(e){
        prevent(e);
        console.log('click content');
        if(this.props.instant){
            this.hide();
        }
    },
    render:function(){
       let [content,...children] = this.props.children;
       return <div className={`dropdown ${this.state.opened?'open':''}`}>
            <div ref='content' className='content arrow arrow-down'>
                {content}
            </div>
            {children}
        </div>
    }
});

export var Icon = React.createClass({
    PropTypes:{
        iconName:React.PropTypes.string.isRequired
    },
    render:function(){
        return <i className={`fa fa-${this.props.iconName}`}></i>
    }
});
export var Slider = React.createClass({
    propTypes:{
        dir:React.PropTypes.oneOf(['vertial','horizon']),
        onChange:React.PropTypes.func,
        onUpdate:React.PropTypes.func
    },
    getDefaultProps:function(){
        const emptyFunc=new Function();
        return {
            dir:'horizon',
            onChange:emptyFunc,
            onUpdate:emptyFunc
        }
    },
    getInitialState:function(){
        return {scale:0};
    },
    startMovingThumb:function(e){
        console.log('start moving');
        prevent(e);
        if (e.which == 1) {
            this.getDOMNode().classList.add('noAnimate');
            this.setThumb(e);
            document.addEventListener('mousemove', this.movingThumb);
            document.addEventListener('mouseup', this.stopMovingThumb);
        }
    },
    setThumb:function(e, finish) {
        let rect = this.getDOMNode().getBoundingClientRect();
        let scale = 0;
        if (this.dir == 'vertial') scale = 1 - (e.clientY - rect.bottom) / rect.height;
        else scale = (e.clientX - rect.left) / rect.width;
        //update state
        if (scale < 0) scale = 0;
        else if (scale > 1) scale = 1;
        this.setState({scale});
        this.props.onUpdate(scale);
        if (finish) this.props.onChange(scale);
    },
    movingThumb : function(e) {
        prevent(e);
        this.setThumb(e);
    },
    stopMovingThumb : function(e) {
        prevent(e);
        this.setThumb(e, true);
        this.getDOMNode().classList.remove('noAnimate');
        document.removeEventListener('mousemove', this.movingThumb);
        document.removeEventListener('mouseup', this.stopMovingThumb);
    },
    componentDidMount:function(){
        this.getDOMNode().addEventListener('mousedown',this.startMovingThumb);
    },
    render:function(){
        let scale = this.state.scale;
        if(this.props.dir==='horizon') scale = {width: scale * 100 + '%'};
        else scale = {height : scale * 100 + '%'};
        return <div className = {'track '+ this.props.dir}>
            {this.props.children}
            <div refs='trackCover' className = 'track-cover' style={scale}></div>
        </div>
    }
})
