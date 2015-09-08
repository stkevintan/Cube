var React = require('react');
module.exports = React.createClass({
    PropTypes:{
        iconName:React.PropTypes.string.isRequired
    },
    render:function(){
        return <i className={'fa fa-'+this.props.iconName}></i>
    }
});
