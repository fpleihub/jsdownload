# jsdownload
原生js多文件批量下载器，效果预览图将demo.png

下载器参照download.js写了文件保存部分，下载文件部分使用“XMLHttpRequest”实现

step1.导入Downer.js
<script type="application/javascript" src="Downer.js"></script>

step2.使用对象
pushTask(下载任务下标，任务ID，下载地址，下载回调)
Downer.pushTask(i,taskId, url, function (index,taskId,status, message, data) {
  //...to do something
})

下载器未实现：
1.控制并发同时下载任务
2.取消下载后无法断点下载
3.用户离开页面后所有下载被停止
