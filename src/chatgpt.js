// import chatgpt  from 'chatgpt';
const config = require('./config')
const AsyncRetry = require('async-retry')

const ErrorCode2Message = {
  '503':
    'OpenAI 服务器繁忙，请稍后再试| The OpenAI server is busy, please try again later',
  '429':
    'OpenAI 服务器限流，请稍后再试| The OpenAI server was limited, please try again later',
  '500':
    'OpenAI 服务器繁忙，请稍后再试| The OpenAI server is busy, please try again later',
  '403':
    'OpenAI 服务器拒绝访问，请稍后再试| The OpenAI server refused to access, please try again later',
  unknown: '未知错误，请看日志 | Error unknown, please see the log'
}
const Commands = [ 'reset', 'help' ]
let ChatGPTAPI = () => {
}

class ChatGPTPool {
  conversationsPool = new Map()

  async startGPTBot() {
    console.debug(`Start GPT Bot Config is:${JSON.stringify(config)}`)
    await this.startPools()
    console.debug(`🤖️ Start GPT Bot Success, ready to handle message!`)
    this.ready = true
  }

  resetConversation(talkid) {
    this.conversationsPool.delete(talkid)
  }

  async startPools() {
    const { ChatGPTAPI: ChatGPTAPIData } = await import('chatgpt')
    ChatGPTAPI = ChatGPTAPIData
    this.chatGPT = new ChatGPTAPI({
      apiKey: config.chatGPTAccountPool.apiKey
    })
  }

  async command(cmd, talkid) {
    console.log(`command: ${cmd} talkid: ${talkid}`)
    if (cmd == 'reset') {
      this.resetConversation(talkid)
      return '♻️ 已重置对话 ｜ Conversation reset'
    }
    if (cmd == 'help') {
      return `🧾 支持的命令｜Support command：${Commands.join('，')}`
    }
    return '❓ 未知命令｜Unknow Command'
  }

  // Randome get conversation item form pool
  getConversation(talkid) {
    if (this.conversationsPool.has(talkid)) {
      return this.conversationsPool.get(talkid)
    }

    const conversation = this.chatGpt
    const conversationItem = {
      conversation
    }
    this.conversationsPool.set(talkid, conversationItem)
    return conversationItem
  }

  setConversation(talkid, obj) {
    const conversationItem = this.getConversation(talkid)
    const params = Object.assign({}, conversationItem, obj)
    this.conversationsPool.set(talkid, obj)
  }

  // send message with talkid
  async getGPTMessage(message, talkid) {
    if (
      Commands.some((cmd) => {
        return message.startsWith(cmd)
      })
    ) {
      return this.command(message, talkid)
    }
    const conversationItem = this.getConversation(talkid)
    const { conversationId, messageId } = conversationItem
    try {
      // TODO: Add Retry logic
     const result = await this.chatGPT.sendMessage(message, {
        conversationId,
        parentMessageId: messageId
      })
      const {
        text,
        conversationId: newConversationId,
        id: newMessageId
      } = result
      console.log('msg', text)
      // Update conversation information
      this.setConversation(talkid, { conversationId: newConversationId, messageId: newMessageId })
      return text
    } catch (err) {
      if (err.message.includes('ChatGPT failed to refresh auth token')) {
        // If refresh token failed, we will remove the conversation from pool
        console.log(`Refresh token failed ${JSON.stringify(config.chatGPTAccountPool.apiKey)}`)
        return this.getGPTMessage(message, talkid)
      }
      console.error(
        `err is ${err.message}, apiKey ${JSON.stringify(config.chatGPTAccountPool.apiKey)}`
      )
      // If send message failed, we will remove the conversation from pool
      this.conversationsPool.delete(talkid)
      // Retry
      return this.error2msg(err)
    }
  }

  // Make error code to more human readable message.
  error2msg(err) {
    for (const code in ErrorCode2Message) {
      if (err.message.includes(code)) {
        return ErrorCode2Message[code]
      }
    }
    return ErrorCode2Message.unknown
  }
}

module.exports = ChatGPTPool
