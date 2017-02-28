**注意** nw.js版本已经不再维护，推荐使用Electron移植版： [Cube in Electron](https://github.com/issac2015/Cube-In-Electron),感谢[@issac2015](https://github.com/issac2015)  

# 网易音乐盒 
使用nw.js构建的网易云音乐的跨平台第三方客户端。    


此外：
- JS版网易API可以参考：     [NetEaseMusic](https://github.com/stkevintan/Cube/blob/master/src/model/NetEaseMusic.js)
- JS版的加密算法可以参考：   [Crypto](https://github.com/stkevintan/Cube/blob/master/src/model/Crypto.js)

### Feature  
1. 设定本地音乐文件夹，递归搜索本地音乐。  
2. 搜索播放网络音乐  
3. 自定义播放列表，可以同时加入网络音乐和本地音乐  
4. 手机帐号或邮箱帐号登录  
5. UI响应式布局与mini模式    
6. 滚动歌词秀    
7. 私人fm  
8. 系统播放提示  
9. 系统托盘    


### Install  
1. 下载安装[nw.js](https://github.com/nwjs/nw.js)
2. 拷贝chrome安装目录下的`libffmpegsumo.so`(windows下是`libffmpegsumo.dll`)至nw.js目录下  
3. 下载并切换至项目：`git clone https://github.com/stkevintan/Cube.git && cd Cube/`  
4. 安装模块: `npm i`
5. 运行： `/path/to/nw .`   

`libffmpegsumo`的版本一定要与nw.js版本对应，否则不支持MP3等常见格式。nw.js v0.12.0对应chrome 41.x +

### Update  
`cd /path/to/Cube/ && git pull`  

### Screenshots  
![FM](https://raw.githubusercontent.com/stkevintan/Cube/master/snapshot/fm.png)  


### Troubleshooting

#### Mini模式还能调窗口大小
这是nw.js的bug

#### 没有声音或者'糟糕，文件或网络资源无法访问'
首先，可能是由于nw.js自带的音频解码器不支持mp3格式，参考`Manual Install`第二步解决。
也有可能是由于网络延时，网络音乐还未解析完全，这种情况等待一下即可。

