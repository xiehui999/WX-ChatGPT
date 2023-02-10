const config = require('./config')
const ChatGPTPool = require('./chatgpt')
const sha1 = require('sha1')
const autoReply = require('./replyXml')
const router = require('express').Router()
const chatGPTPool = new ChatGPTPool()

chatGPTPool.startGPTBot()
const cacheMsg = {}

router.get('/wx', function wxAccess(req, res) {
  var token = config.token
  var signature = req.query.signature
  var nonce = req.query.nonce
  var timestamp = req.query.timestamp
  var echostr = req.query.echostr
  var str = [ token, timestamp, nonce ].sort().join('')
  var sha = sha1(str)

  if (sha === signature) {
    res.end(echostr + '')
    console.log('[wxAccess] 授权成功!')
  } else {
    res.end('wrong')
    console.log('[wxAccess] 授权失败!')
  }
})

router.post('/wx', async function (req, res) {
  //设置返回数据header
  res.writeHead(200, { 'Content-Type': 'application/xml' })
  const { msgtype, content, fromusername, msgid } = req.body.xml
  console.log('[weixin] request:', content, msgid, fromusername, msgtype,)
  if (msgtype === 'event') {
    if (req.body.xml.event === 'subscribe') {
      let reply = '欢迎关注本公众号体验ChatGPT, 带宽有限以及 OpenApi 国内不稳定,会偶尔出现服务不可用'
      var resMsg = autoReply('text', req.body.xml, reply)
      console.log('[weixin] reply message')
      res.end(resMsg)
    } else if (req.body.xml.event === 'unsubscribe') {
      console.log('[weixin] 已取消关注')
      res.end('success')
    }
  } else if (msgtype === 'text') {
    let msg = ''
    if (cacheMsg[msgid]) {
      console.log('getcacheMsg')
      msg = cacheMsg[msgid]
    } else {
      console.log('getGPTMessage')
      msg = await chatGPTPool.getGPTMessage(content, fromusername)
    }
    cacheMsg[msgid] = msg
    const resMsg = autoReply('text', req.body.xml, msg)
    res.end(resMsg || 'success')
  } else {
    const resMsg = autoReply(msgtype, req.body.xml, '不支持该类型')
    res.end(resMsg || 'success')
  }

})

module.exports = router
