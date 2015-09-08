var React =require('react');
module.exports = React.createClass({displayName: "exports",
    render:function(){
        PropTypes:{
            items:React.PropTypes.array
        }
        return React.createElement("ul", {className: 'list-inline '+ this.props.className}, 
            "//items or children?", 
            this.props.items.map(function(item,index){
                    return React.createElement("li", {key: index, className: item.className}, 
                    React.createElement("a", {href: "javascript:0"}, item.content))
            })
        )
    }
})
