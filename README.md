#网易音乐盒 
使用html5和node.js构建的网易云音乐的跨平台第三方客户端。 
目前使用nw.js下个版本准备使用electron(atom-shell)  
 
###Release    
百度网盘: [linux64](http://pan.baidu.com/s/1mgrIGVQ)  

###Feature  
1. 设定本地音乐文件夹，递归搜索本地音乐。  
2. 搜索播放网络音乐  
3. 自定义播放列表，可以同时加入网络音乐和本地音乐  
4. 手机帐号或邮箱帐号登录  
5. UI响应式布局与mini模式    
6. 滚动歌词秀    
7. 私人fm  
8. 系统播放提示  
9. 系统托盘    


###Manual Install  
1. 下载安装[nw.js](https://github.com/nwjs/nw.js)
2. 拷贝chrome安装目录下的`libffmpegsumo.so`(windows下是`libffmpegsumo.dll`)至nw.js目录下  
3. 下载并切换至项目：`git clone https://github.com/stkevintan/nw_musicbox.git && cd nw_musicbox/`  
4. 安装模块: `npm i`
5. 运行： `/path/to/nw .`   

`libffmpegsumo`的版本一定要与nw.js版本对应，否则不支持MP3等常见格式。nw.js v0.12.0对应chrome 41.x +


###Update
`cd /path/to/NetEaseMusic/ && git pull`  

###Screenshots
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s59.png"/>
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s60.png"/>
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s52.png"/>

###Developer tips  
本项目前端使用jade、stylus与bootstrap框架，源文件包括在src中，使用gulp自动构建至dist文件夹中。  
本项目结构类似于MVC结构，所有定义ui交互等运行于web context中的文件皆置于controller文件夹中，所有定义数据模型、处理网络或本地事务等运行于node context中的文件皆置于model文件夹中。  
controller中包括：   
- `category` 管理播放列表目录（sidebar）
- `account`  管理账户
- `nav`  管理顶栏
- `lrc`  歌词面板
- `player`  底部播放器
- `playlist` 歌曲列表
- `radio` 私人fm
- `settings` 设置面板
- `tray` 托盘图标

model中包括：   
- `EntryModel` 定义播放列表源
- `PlaylistModel` 定义播放列表
- `SongModel` 定义歌曲
- `FileManager` 处理本地文件系统
- `NetEaseMusic` 处理网络（既api）
- `Crypto` 加密模块
- `Utils` 对node.js中util的扩展，包括二分查找、队列等实用工具

目前已经定义了本地、用户、云音乐三个播放列表源。可以通过扩展entry对象添加新的播放列表源。

###Troubleshooting

####Mini模式还能调窗口大小
这是nw.js的bug

####没有声音或者'糟糕，文件或网络资源无法访问'
首先，可能是由于nw.js自带的音频解码器不支持mp3格式，参考`Manual Install`第二步解决。
也有可能是由于网络延时，网络音乐还未解析完全，这种情况等待一下即可。

