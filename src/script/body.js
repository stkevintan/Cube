import React from 'react';
import {Sidebar} from './sidebar';
import {View} from './view';
export var Body = React.createClass({
    render:function(){
        return <div style={{height:'100%'}}>
                    <Sidebar active={this.props.active} />
                    <View active={this.props.active} />
                </div>
    }
})
