var React = require('react');

module.exports = React.createClass({
    render:function(){
        return <div className='dropdown'>
            <div className='content arrow arrow-down'>
                {this.props.content}
            </div>
            {this.props.children}
        </div>
    }
});
