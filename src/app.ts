const express = require('express')
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
const weixin = require('./weixin');
// 创建服务器
const app = express()

require('babel-register')({
  presets: [
    'env',
  ],
});
//解析xml
app.use(bodyParser.xml({
  limit: '1MB',
  xmlParseOptions: {
    normalize: true,
    normalizeTags: true,
    explicitArray: false
  }
}));

app.use('/',weixin);


// 启动服务器
app.listen(9001,(req: any,res: any)=>{
  console.log();
})
