var sidebar=(function(){
    var self = document.querySelector('#body .sidebar');
    var EntryTool = React.createClass({
        render:function(){
            var inner;
            if(this.props.type==='entry')inner=['plus','pencil','trash'];
            else inner=['plus','refresh'];
            return <div className='tools'>
            {inner.map(function(name,index){
                return <a key={index} href='javascript:0'><i className={'fa fa-'+name}></i></a>
            })}
            </div>
        }
    });
    var Entry = React.createClass({
        render:function(){
            return <li id={this.props.key}>
                    <a href='javascript:0' className='txt'>{this.props.data.name}</a>
                    <EntryTool type = 'entry'/>
            </li>
        }
    })
    var Source = React.createClass({
        render:function(){
            return <div className='source'>
                <div className='head'>
                    <h4 className='txt'>{this.props.data.name}</h4>
                    <EntryTool type='head' />
                </div>
                <ol className='entries'>
                    {this.props.data.entryList.map(function(entry,index){
                        var key=this.props.id+'_'+index;
                        return <Entry key={key} id={key} data={entry} />
                    }.bind(this))}
                </ol>
            </div>
        }
    });
    var Sidebar = React.createClass({
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
                inner.push(<Source key={key} id={key} data={this.state[key]} />);
            }
            return <div>{inner}</div>
        }
    });
    React.render(<Sidebar />,self);
})();
