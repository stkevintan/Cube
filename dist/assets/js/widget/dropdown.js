var React = require('react');

module.exports = React.createClass({displayName: "exports",
    render:function(){
        return React.createElement("div", {className: "dropdown"}, 
            React.createElement("div", {className: "content arrow arrow-down"}, 
                this.props.content
            ), 
            this.props.children
        )
    }
});
