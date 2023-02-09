const config = require('./config')
const ChatGPTPool = require('./chatgpt')
const sha1 = require('sha1')
const autoReply = require('./replyXml')
const router = require('express').Router()
const chatGPTPool = new ChatGPTPool()

chatGPTPool.startGPTBot()
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
  console.log(autoReply)
  //设置返回数据header
  res.writeHead(200, { 'Content-Type': 'application/xml' })
  console.log('[weixin] request:')
  const { msgtype, content, fromusername } = req.body.xml
  console.log(req.body.xml, msgtype)
  if (msgtype === 'event') {
    if (req.body.xml.event === 'subscribe') {
      let reply = '欢迎关注本公众号体验ChatGPT'
      var resMsg = autoReply('text', req.body.xml, reply)
      console.log('[weixin] reply message')
      console.log(resMsg)
      res.end(resMsg)
    } else if (req.body.xml.event === 'unsubscribe') {
      console.log('[weixin] 已取消关注')
      res.end('success')
    }
  } else if (msgtype === 'text') {
    const msg = await chatGPTPool.getGPTMessage(content, fromusername)
    console.log('msg', msg)
    const resMsg = autoReply('text', req.body.xml, msg)
    res.end(resMsg || 'success')
  } else {
    var resMsg = autoReply(m, req.body.xml, '活动电子票')
    res.end(resMsg || 'success')
  }

})

module.exports = router