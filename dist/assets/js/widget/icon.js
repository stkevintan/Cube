var React = require('react');
module.exports = React.createClass({displayName: "exports",
    PropTypes:{
        iconName:React.PropTypes.string.isRequired
    },
    render:function(){
        return React.createElement("i", {className: 'fa fa-'+this.props.iconName})
    }
});
