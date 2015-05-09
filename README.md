# NetEaseMusic
目前还不支持帐号登录

###功能
1. 设定本地音乐文件夹，播放本地音乐  
2. 搜索播放网络音乐  
3. 设置自定义播放列表，可以同时加入网络音乐和本地音乐  

###安装
1.首先安装[nw.js](https://github.com/nwjs/nw.js)  
2.拷贝chromium或者chrome安装目录下的`libffmpegsumo.so`至nw.js的安装目录下  
3.下载项目：`git clone https://github.com/stkevintan/NetEaseMusic.git`    
4. 运行： `nw /path/to/NetEaseMusic/`  

###更新
`cd /path/to/NetEaseMusic/ && git pull`  

###截图  
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s10.png" />  
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s11.png" />  
<img src="http://7xiyak.com1.z0.glb.clouddn.com/s12.png" />  

###troubleshooting
遇到什么问题可以尝试一下删除项目主目录中data目录再重启。  
####没有声音  
可能是没有相应的解码器，这是nw.js的问题，参考 <https://github.com/nwjs/nw.js/wiki/Using-MP3-%26-MP4-%28H.264%29-using-the--video--%26--audio--tags.> 解决。  
