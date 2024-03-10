Bot.processContent = async function (content, message, e) {
  const start = e.user_id ? `![Lain-plugin #30px #30px](https://q1.qlogo.cn/g?b=qq&s=100&nk=${e.user_id}) [@${e.sender.card || e.sender.nickname}](mqqapi://markdown/mention?at_type=1&at_tinyid=${e.user_id})\r***\r` : ''
  const end = '喵~'
  content = start + content + end
  return { content, message }
}
