# NetEaseMusic  

使用html5和node.js构建的网易云音乐的跨平台第三方客户端。

目前bug还比较多，尚在完善。

###Feature  
1. 设定本地音乐文件夹，播放本地音乐
2. 搜索播放网络音乐
3. 设置自定义播放列表，可以同时加入网络音乐和本地音乐
4. 手机帐号登录

###TO DO    
1. 其他方式登录  
2. UI响应式布局优化，实现mini模式  
3. 列表项目的自由拖动排序    
3. 私人fm  
4. 歌词  

###Install  
1.首先安装[nw.js](https://github.com/nwjs/nw.js)  
2.拷贝chromium或者chrome安装目录下的`libffmpegsumo.so`至nw.js的安装目录下  
3.下载项目：`git clone https://github.com/stkevintan/NetEaseMusic.git`    
4. 运行： `nw /path/to/NetEaseMusic/`  

###Update  
`cd /path/to/NetEaseMusic/ && git pull`  

###Screenshots    
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s10.png" />  
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s11.png" />  
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s12.png" />
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s14.png" />
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s15.png" />

###troubleshooting  
遇到什么问题可以尝试一下删除项目主目录中data目录再重启。  

####没有声音  
可能是没有相应的解码器，这是nw.js的问题，参考 <https://github.com/nwjs/nw.js/wiki/Using-MP3-%26-MP4-%28H.264%29-using-the--video--%26--audio--tags.> 解决。  
