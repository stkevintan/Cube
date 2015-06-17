# NW Musicbox  

使用html5和node.js构建的网易云音乐的跨平台第三方客户端。    
<img style="vertical-align:middle;margin-right:50px" src="http://7xiyak.com1.z0.glb.clouddn.com/icon.png"/>  
###Release  
__version 1.3.0_Beta__  
Linux:[x64](http://7xiyak.com1.z0.glb.clouddn.com/1.3.0linux64Beta.zip)  

__version 1.2.2__  
Linux:[x64](http://7xiyak.com1.z0.glb.clouddn.com/1.2.2linux64.zip)  

__version 1.1.0__     
Linux :[x64](http://7xiyak.com1.z0.glb.clouddn.com/1.1.0nwMusicBox_linux64.zip)     
~~Windows : [x64](http://7xiyak.com1.z0.glb.clouddn.com/1.1.0nwMusicBox_win64.zip)~~  
其他平台参考`Manual Install`  

###Feature  
1. 设定本地音乐文件夹，播放本地音乐  
2. 搜索播放网络音乐
3. 设置自定义播放列表，可以同时加入网络音乐和本地音乐
4. 手机帐号或邮箱帐号登录
5. UI响应式布局优化，实现mini模式
6. 侧栏列表鼠标拖动排序  
7. 滚动歌词  

###TO DO    
~~1. 其他方式登录~~  
~~2. UI响应式布局优化，实现mini模式~~  
3. 托盘图标  
4. 列表项目的自由拖动排序    
5. 私人fm  
~~6. 歌词~~  

###Manual Install  
1. 首先安装[nw.js](https://github.com/nwjs/nw.js)
2. 拷贝chrome安装目录下的`libffmpegsumo.so`(windows下是`libffmpegsumo.dll`)至nw.js的安装目录下
3. 下载并切换至项目：`git clone https://github.com/stkevintan/nw_musicbox.git && cd nw_musicbox/`
4. 安装模块: `npm i`
4. 运行： `/path/to/nw .`   

####Notice  
<b>`libffmpegsumo`的版本一定要与nw.js版本对应，否则会出现问题。</b>
比如：nw.js v0.12.0对应chrome 41.0.2272.76


###Update
`cd /path/to/NetEaseMusic/ && git pull`


###Screenshots
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s50.png"/>
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s51.png"/>
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s52.png"/>


###troubleshooting
遇到什么问题可以尝试一下删除项目主目录中data目录再重启。

####Mini模式还能调窗口大小
这是nw.js的bug

####没有声音或者'糟糕，文件或网络资源无法访问'
首先，可能是由于nw.js自带的音频解码器不支持mp3格式，参考`Manual Install`第二步解决。
也有可能是由于网络延时，网络音乐还未解析完全，这种情况等待一下即可。

