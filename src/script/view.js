import React from 'react';
import ipc from 'ipc';
import {Media,Button,Icon} from './component';
export const View=React.createClass({
    getInitialState:()=>({}),
    componentDidMount:function(){
        ipc.on('source-loaded',(key,source)=>{
            this.state[key]=source;
            this.setState(this.state);
        });
    },
    render:function(){
        let inner=[];
        for(let key in this.state){
            let source=this.state[key];
            for(let i=0;i< source.entryList.length;i++){
                let entry = source.entryList[i];
                inner.push(
                    <section className={'view-playlist slim-scrollbar'}>
                        <Media className='playlist-intro panel' imgUrl='assets/img/album.png'>
                            <ul className='list-prefix playlist-desc'>
                                <li data-item='歌单名'>{entry.name}</li>
                                <li data-item='创造者'>{entry.creator}</li>
                                <li data-item='描述'>{entry.desc}</li>
                            </ul>
                        </Media>
                        <div className='playlist panel'>
                            <div className='container-row heading'>
                                <h1 className='left title txt'>歌曲列表</h1>
                                <div className='right btn-group playlist-display'>
                                    <Button active={true}><Icon iconName='list' /></Button>
                                    <Button><Icon iconName='th'/></Button>
                                </div>
                            </div>
                            <table className='stripe index playlist-content'>
                                <thead>
                                    <tr>
                                        <th className='index'>#</th>
                                        <th className='title'>标题</th>
                                        <th className='time'>时长</th>
                                        <th className='artist'>歌手</th>
                                        <th className='album'>专辑</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entry.songList.map(function(song){
                                        return <tr>
                                            <td className='index'>
                                                <Icon iconName='music' className='active' />
                                                <Icon iconName='play' className='hint' />
                                            </td>
                                            <td className='title'>{song.name}</td>
                                            <td className='time'>{song.duration}</td>
                                            <td className='artist'>{song.artist}</td>
                                            <td className='album'>{song.album}</td>
                                        </tr>
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )
            }
        }
        return <div className='view'>{inner}</div>
    }
})
