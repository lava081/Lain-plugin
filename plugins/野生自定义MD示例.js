Bot.processContent = async function (content, message, e) {
  const start = e.user_id ? `![Lain-plugin #30px #30px](https://q1.qlogo.cn/g?b=qq&s=100&nk=${e.user_id}) [@${e.sender.card || e.sender.nickname}](mqqapi://markdown/mention?at_type=1&at_tinyid=${e.user_id})\r***\r` : ''
  const end = '喵~\r***\r[🔗赞助](https://afdian.net/a/lava081)\t[🔗交流群](https://qm.qq.com/q/tizfRnm6SO)\t[🔗防封账号](https://qun.qq.com/qunpro/robot/qunshare?robot_uin=2854216359&robot_appid=102073196&biz_type=0)'
  content = start + content + end
  return { content, message }
}
