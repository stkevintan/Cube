var React = require('react');
module.exports = React.createClass({
    propTypes:{
        dir:React.PropTypes.oneOf(['vertial','horizon']),
        onChnage:React.PropTypes.func,
        onUpdate:React.PropTypes.func
    },
    getDefaultProps:function(){
        var emptyFunc=new Function();
        return {
            dir:'horizon',
            onChnage:emptyFunc,
            onUpdate:emptyFunc
        }
    },
    getInitialState:function(){
        return {scale:0};
    },
    startMovingThumb:function(e){
        prevent(e);
        if (e.which == 1) {
            this.getDOMNode().classList.add('noAnimate');
            this.setThumb(e);
            this.MovingThumb = this.movingThumb.bind(this);
            this.stopMovingThumb = this.stopMovingThumb.bind(this);
            document.addEventListener('mousemove', this.MovingThumb);
            document.addEventListener('mouseup', this.stopMovingThumb);
        }
    },
    setThumb:function(e, finish) {
        var rect = this.getDOMNode().getBoundingClientRect();
        if (this.dir == 'vertial') scale = 1 - (e.clientY - rect.top) / rect.height;
        else scale = (e.clientX - rect.left) / rect.width;
        //update state
        this.setState(scale);
        this.onUpdate(scale);
        if (finish) this.onChange(scale);
    },
    movingThumb : function(e) {
        prevent(e);
        this.setThumb(e);
    },
    stopMovingThumb : function(e) {
        prevent(e);
        this.setThumb(e, true);
        this.getDOMNode().classList.remove('noAnimate');
        document.removeEventListener('mousemove', this.MovingThumb);
        document.removeEventListener('mouseup', this.stopMovingThumb);
    },
    componentDidMount:function(){
        this.componentWillUnmount = this.startMovingThumb.bind(this);
        this.getDOMNode().addEventListener('mousedown', this.startMovingThumb);
    },
    componentWillUnmount:function(){
        this.getDOMNode().removeEventListener('mousedown',this.startMovingThumb);
    },
    render:function(){
        var scale = this.state.scale;
        if (scale < 0) scale = 0;
        else if (scale > 1) scale = 1;
        if(this.props.dir=='horizon') scale = 'width:'+scale*100+'%';
        else scale = 'height' + scale * 100 + '%';

        return <div className = {'track '+ this.props.dir}>
            {this.props.children}
            <div refs='trackCover' className = 'track-cover' style={scale}></div>
        </div>
    }
});
