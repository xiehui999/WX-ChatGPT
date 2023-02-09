/**
 *
 * @param msgType {string} 收到的信息的内容
 * @param info {string} 返回消息的内容
 * @returns {string} 返回xml字符串用作消息内容
 */

function autoReply(msgType: string, requestData: any, desc: string) {
  console.log('autoReply', msgType)
  let  resMsg = ''
  switch (msgType) {
    case 'text':
       resMsg = '<xml>' +
        '<ToUserName><![CDATA[' + requestData.fromusername + ']]></ToUserName>' +
        '<FromUserName><![CDATA[' + requestData.tousername + ']]></FromUserName>' +
        '<CreateTime>' + (new Date().getTime()) + '</CreateTime>' +
        '<MsgType><![CDATA[text]]></MsgType>' +
        '<Content><![CDATA['+desc+']]></Content>' +
        '</xml>';
      break;
  }
  return resMsg;
}

module.exports = autoReply;
