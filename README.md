# NetEaseMusic  

使用html5和node.js构建的网易云音乐的跨平台第三方客户端。    

欢迎大神一起开发。  
###Release  
__version 1.1.0__  
Linux :[x64](http://7xiyak.com1.z0.glb.clouddn.com/ReleasenwMusicBox_linux64.zip)   
下载后解压，运行install.sh即可自动创建桌面图标    
其他平台参考`Manual Install`  

###Feature  
1. 设定本地音乐文件夹，播放本地音乐  
2. 搜索播放网络音乐
3. 设置自定义播放列表，可以同时加入网络音乐和本地音乐
4. 手机帐号或邮箱帐号登录
5. UI响应式布局优化，实现mini模式
6. 侧栏列表鼠标拖动排序  

###TO DO    
~~1. 其他方式登录~~  
~~2. UI响应式布局优化，实现mini模式~~  
3. 托盘图标  
4. 列表项目的自由拖动排序    
5. 私人fm  
6. 歌词  

###Manual Install  
1.首先安装[nw.js](https://github.com/nwjs/nw.js)  
2.拷贝chrome安装目录下的`libffmpegsumo.so`(windows下是`libffmpegsumo.dll`)至nw.js的安装目录下。        
3.下载项目：`git clone https://github.com/stkevintan/NetEaseMusic.git`    
4. 运行： `nw /path/to/NetEaseMusic/`  
####Notice  
<b>`libffmpegsumo`的版本一定要与nw.js版本对应，否则会出现问题。</b>   
比如：nw.js v0.12.0对应chrome 41.0.2272.76  


###Update  
`cd /path/to/NetEaseMusic/ && git pull`  

###Screenshots
主界面
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s23.png" />
搜索音乐
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s24.png" />
简洁模式  
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s25.png" />
###troubleshooting  
遇到什么问题可以尝试一下删除项目主目录中data目录再重启。  

####没有声音  
可能是没有相应的解码器，这是nw.js的问题，参考 <https://github.com/nwjs/nw.js/wiki/Using-MP3-%26-MP4-%28H.264%29-using-the--video--%26--audio--tags.> 解决。  
