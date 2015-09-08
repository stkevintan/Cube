var React = require('react');
var EntryTool = React.createClass({displayName: "EntryTool",
    render:function(){
        var inner;
        if(this.props.type==='entry')inner=['plus','pencil','trash'];
        else inner=['plus','refresh'];
        return React.createElement("div", {className: "tools"}, 
        inner.map(function(name,index){
            return React.createElement("a", {key: index, href: "javascript:0"}, React.createElement("i", {className: 'fa fa-'+name}))
        })
        )
    }
});
var Entry = React.createClass({displayName: "Entry",
    render:function(){
        return React.createElement("li", {id: this.props.key}, 
                React.createElement("a", {href: "javascript:0", className: "txt"}, this.props.data.name), 
                React.createElement(EntryTool, {type: "entry"})
        )
    }
})
var Source = React.createClass({displayName: "Source",
    render:function(){
        return React.createElement("div", {className: "source"}, 
            React.createElement("div", {className: "head"}, 
                React.createElement("h4", {className: "txt"}, this.props.data.name), 
                React.createElement(EntryTool, {type: "head"})
            ), 
            React.createElement("ol", {className: "entries"}, 
                this.props.data.entryList.map(function(entry,index){
                    var key=this.props.id+'_'+index;
                    return React.createElement(Entry, {key: key, id: key, data: entry})
                }.bind(this))
            )
        )
    }
});
var Sidebar = React.createClass({displayName: "Sidebar",
    getInitialState:function(){
        return {};
    },
    componentDidMount:function(){
        ipc.on('source-loaded',function(key,source){
            this.state[key] = source;
            this.setState(this.state);
        }.bind(this));
    },
    render:function(){
        var inner=[];
        for(var key in this.state){
            inner.push(React.createElement(Source, {key: key, id: key, data: this.state[key]}));
        }
        return React.createElement("div", null, inner)
    }
});
module.exports = Sidebar;
