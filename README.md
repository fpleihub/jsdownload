# jsdownload
原生js多文件批量下载器，效果预览图将demo.png

<img src='https://raw.githubusercontent.com/lambertlei/jsdownload/main/demo.png'/>

<br/>
下载器参照download.js写了文件保存部分，下载文件部分使用“XMLHttpRequest”实现

<br/>
<br/>
# step1.导入Downer.js<br/>
<script type="application/javascript" src="Downer.js"></script><br/>

<br/>
# step2.使用对象<br/>
pushTask(下载任务下标，任务ID，下载地址，下载回调)<br/>
Downer.pushTask(i,taskId, url, function (index,taskId,status, message, data) {
  //...to do something
})
<br/>
<br/>

下载器未实现：<br/>
1.控制并发同时下载任务<br/>
2.取消下载后无法断点下载<br/>
3.用户离开页面后所有下载被停止<br/>
