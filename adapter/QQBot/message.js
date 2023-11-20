import fs from "fs"
import path from "path"
import Yaml from "yaml"
import { exec } from "child_process"
import common from "../../model/common.js"
import { encode as encodeSilk } from "silk-wasm"

export default new class message {
    /** 转换格式给云崽 */
    async msg(e, isGroup) {
        e.bot.stat = Bot?.[e.self_id]?.stat
        const _reply = e.reply
        e.message = await this.message(e.message, true)
        /** 回复 */
        const reply = async (msg, quote) => {
            msg = await this.message(msg)
            try {
                _reply.call(e, msg, quote)
            } catch (error) {
                common.log(e.self_id, error.data, "error")
            }
        }

        e.reply = reply
        /** 快速撤回 */
        e.recall = async () => { return }

        /** 获取对应用户头像 */
        e.getAvatarUrl = (size = 0, id = user_id) => {
            return `https://q1.qlogo.cn/g?b=qq&s=${size}&nk=${id}`
        }

        /** 构建场景对应的方法 */
        if (isGroup) {
            const member = {
                info: {
                    group_id: e.group_id,
                    user_id: e.user_id,
                    nickname: "",
                    last_sent_time: "",
                },
                group_id: e.group_id,
                is_admin: false,
                is_owner: false,
                /** 获取头像 */
                getAvatarUrl: (size = 0) => {
                    return `https://q1.qlogo.cn/g?b=qq&s=${size}&nk=${e.user_id}`
                },
                mute: async (time) => {
                    return
                },
            }

            e.member = member
            e.group_name = e.group_id

            e.group = {
                pickMember: (id) => {
                    return {
                        member,
                        getAvatarUrl: (size = 0, userId = id) => `https://q1.qlogo.cn/g?b=qq&s=${size}&nk=${userId}`
                    }
                },
                getChatHistory: async (msg_id, num, reply) => {
                    return ["test"]
                },
                recallMsg: async (msg_id) => {
                    return
                },
                sendMsg: async (msg, quote) => {
                    return reply(msg, quote)
                },
                makeForwardMsg: async (forwardMsg) => {
                    return await common.makeForwardMsg(forwardMsg, false)
                },
                /** 戳一戳 */
                pokeMember: async (operator_id) => {
                    return
                },
                /** 禁言 */
                muteMember: async (group_id, user_id, time) => {
                    return
                },
                /** 全体禁言 */
                muteAll: async (type) => {
                    return
                },
                getMemberMap: async () => {
                    return
                },
                /** 退群 */
                quit: async () => {
                    return
                },
                /** 设置管理 */
                setAdmin: async (qq, type) => {
                    return
                },
                /** 踢 */
                kickMember: async (qq, reject_add_request = false) => {
                    return
                },
                /** 头衔 **/
                setTitle: async (qq, title, duration) => {
                    return
                },
                /** 修改群名片 **/
                setCard: async (qq, card) => {
                    return
                },
            }
        } else {
            e.friend = {
                sendMsg: async (msg, quote) => {
                    return reply(msg, quote)
                },
                recallMsg: async (msg_id) => {
                    return
                },
                makeForwardMsg: async (forwardMsg) => {
                    return await common.makeForwardMsg(forwardMsg, false)
                },
                getChatHistory: async (msg_id, num, reply = true) => {
                    return ["test"]
                },
                getAvatarUrl: async (size = 0, userID = user_id) => {
                    return `https://q1.qlogo.cn/g?b=qq&s=${size}&nk=${userID}`
                }
            }
        }

        /** 将收到的消息转为字符串 */
        e.toString = () => {
            return e.raw_message
        }

        /** 添加适配器标识 */
        e.adapter = "QQBot"

        return e
    }


    /** 处理图片 */
    async get_image(i) {
        let filePath
        const folderPath = process.cwd() + `/plugins/Lain-plugin/resources/image`
        if (i?.url) i.url.includes("gchat.qpic.cn") && !i.url.startsWith("https://") ? i.file = "https://" + i.url : i.file = i.url
        // 检查是否是Buffer类型
        if (i.file?.type === "Buffer") {
            filePath = path.join(folderPath, `${Date.now()}.jpg`)
            fs.writeFileSync(filePath, Buffer.from(i.file.data))
        }
        // 检查是否是Uint8Array类型
        else if (i.file instanceof Uint8Array) {
            filePath = path.join(folderPath, `${Date.now()}.jpg`)
            fs.writeFileSync(filePath, Buffer.from(i.file))
        }
        // 检查是否是ReadStream类型
        else if (i.file instanceof fs.ReadStream) {
            filePath = path.join(folderPath, `${Date.now()}${path.extname(i.file.path)}`)
            fs.copyFileSync(i.file.path, filePath)
        }
        // 检查是否是base64格式的字符串
        else if (typeof i.file === "string" && /^base64:\/\//.test(i.file)) {
            const base64Data = i.file.replace(/^base64:\/\//, "")
            filePath = path.join(folderPath, `${Date.now()}.jpg`)
            fs.writeFileSync(filePath, base64Data, 'base64')
        }
        // 如果是url，则直接返回url
        else if (typeof i.file === "string" && /^http(s)?:\/\//.test(i.file)) {
            return { ...i, type: "image", file: i.file }
        }
        // 检查是否是字符串类型，且不是url
        else if (typeof i.file === "string") {
            const localPath = i.file.replace(/^file:\/\//, "")
            if (fs.existsSync(localPath)) {
                filePath = path.join(folderPath, `${Date.now()}${path.extname(localPath)}`)
                fs.copyFileSync(localPath, filePath)
            } else {
                common.log("QQBotApi", `本地文件不存在：${i}`, "error")
                return { ...i, type: "text", text: "本地文件不存在..." }
            }
        }
        // 留个容错
        else {
            common.log("QQBotApi", `未知格式：${i}`, "error")
            return { ...i, type: "text", text: "未知格式...请寻找作者适配..." }
        }

        // 返回名称
        if (fs.existsSync(filePath)) {
            const obj = await this.Upload_File(filePath, "image")
            return { ...i, ...obj }
        } else {
            common.log("QQBotApi", `文件保存失败:${i}`, "error")
            return { ...i, type: "text", text: "文件保存失败..." }
        }
    }

    /** 处理视频 */
    async get_video(i) {
        let filePath
        const folderPath = process.cwd() + `/plugins/Lain-plugin/resources/image`

        if (typeof i.file === "string" && /^http(s)?:\/\//.test(i.file)) return i
        else if (fs.existsSync(i.file)) {
            filePath = path.join(folderPath, `${Date.now()}${path.extname(i.file)}`)
            fs.copyFileSync(i.file, filePath)
        } else {
            common.log("QQBotApi", `本地文件不存在：${i}`, "error")
            return { type: "text", text: "本地文件不存在..." }
        }

        // 返回名称
        if (fs.existsSync(filePath)) {
            return await this.Upload_File(filePath, "video")
        } else {
            common.log("QQBotApi", `文件保存失败:${i}`, "error")
            return { type: "text", text: "文件保存失败..." }
        }
    }

    /** 处理语音... */
    async get_audio(i) {
        const folderPath = process.cwd() + `/plugins/Lain-plugin/resources/image`
        const file = `${folderPath}/${Date.now()}${path.extname(i.file) || ".mp3"}`
        const pcm = path.join(folderPath, `${Date.now()}.pcm`)
        const silk = path.join(folderPath, `${Date.now()}.silk`)

        if (typeof i.file === "string" && /^http(s)?:\/\//.test(i.file)) {
            try {
                /** 下载 */
                const res = await fetch(i.file)
                if (res.ok) {
                    /** 将响应数据转为二进制流并写入文件 */
                    const buffer = await res.arrayBuffer()
                    fs.writeFileSync(file, Buffer.from(buffer))
                    common.log("QQBot", "语音文件下载成功", "mark")
                } else {
                    common.log("QQBot", "语音文件下载成功", "mark")
                }
            } catch (error) {
                common.error("QQBot", error.message, "errror")
            }
            i.file = file
        }
        if (fs.existsSync(i.file)) {
            try {
                /** mp3 转 pcm */
                await this.runFfmpeg(i.file, pcm)
            } catch (error) {
                console.error(`执行错误: ${error}`)
            }
            /** pcm 转 silk */
            await encodeSilk(fs.readFileSync(pcm), 48000)
                .then((silkData) => {
                    /** 转silk完成，保存 */
                    fs.writeFileSync(silk, silkData)
                    /** 删除初始mp3文件 */
                    fs.unlink(file, (err) => { })
                    /** 删除pcm文件 */
                    fs.unlink(pcm, (err) => { })
                    common.log("QQBot", `silk转码完成${silk}`, "mark")
                })
                .catch((err) => {
                    common.log("QQBot", `转码失败${err}`, "error")
                })

        } else {
            common.log("QQBotApi", `本地文件不存在：${i}`, "error")
            return { type: "text", text: "本地文件不存在..." }
        }

        // 返回名称
        if (fs.existsSync(silk)) {
            return await this.Upload_File(silk, "audio")
        } else {
            common.log("QQBotApi", `文件保存失败:${i}`, "error")
            return { type: "text", text: "文件保存失败..." }
        }
    }

    async runFfmpeg(input, output) {
        return new Promise(async (resolve, reject) => {
            let cm
            let ret = await this.execSync("ffmpeg -version")
            if (ret.stdout) {
                cm = `ffmpeg`
            } else {
                const cfg = Yaml.parse(fs.readFileSync("./config/config/bot.yaml", "utf8"))
                cm = `"${cfg.ffmpeg_path}"`
            }
            exec(`${cm} -i "${input}" -f s16le -ar 48000 -ac 1 "${output}"`, async (error, stdout, stderr) => {
                if (error) {
                    common.log("QQBot", `执行错误: ${error}`, "error")
                    reject(error)
                    return
                }
                common.log("QQBot", "ffmpeg转码完成")
                resolve()
            }
            )
        })
    }

    async execSync(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
                resolve({ error, stdout, stderr })
            })
        })
    }

    async message(e, t = false) {
        if (!Array.isArray(e)) e = [e]
        let msg = false
        const message = []
        for (let i in e) {
            switch (typeof e[i]) {
                case "string":
                    if (!msg && t && Bot.lain.cfg.QQBotPrefix) {
                        msg = true
                        message.push({ type: "text", text: e[i].trim().replace(/^\//, "#") })
                    } else {
                        message.push({ type: "text", text: e[i] })
                    }
                    break
                case "object":
                    try {
                        switch (e[i].type) {
                            case "image":
                                message.push(await this.get_image(e[i]))
                                break
                            case "text":
                                if (!msg && t && Bot.lain.cfg.QQBotPrefix) {
                                    msg = true
                                    e[i].text = e[i].text.trim().replace(/^\//, "#")
                                    message.push(e[i])
                                } else {
                                    message.push(e[i])
                                }
                                break
                            case "video":
                                message.push(await this.get_video(e[i]))
                                break
                            case "record":
                                message.push(await this.get_audio(e[i]))
                                break
                            case "at":
                                break
                            default:
                                message.push(e[i])
                                break
                        }
                    } catch (err) {
                        message.push(e[i])
                    }
                    break
                default:
                    message.push(e[i])
            }

        }
        return message
    }

    async Upload_File(filePath, type) {
        const { FigureBed, port, QQBotImgIP, QQBotPort, QQBotImgToken } = Bot.lain.cfg
        let url
        // 先调用三方图床
        try {
            if (FigureBed && type === "image") {
                const res = await common.uploadFile(filePath, FigureBed)
                if (res.ok) {
                    const { result } = await res.json()
                    url = FigureBed.replace("/uploadimg", "") + result.path
                    common.log("QQBot图床", `[上传成功] ${url}`)
                    return { type, file: url }
                } else {
                    const data = await res.json()
                    common.log("", `QQBot图床发生错误，将调用下一个方法：${data}`, "error")
                }
            }
        } catch {
            common.log("", `QQBot图床发生错误，将调用下一个方法`, "error")
        }

        // 公网，反正都要返回东西，先赋值吧
        url = `http://${QQBotImgIP}:${QQBotPort || port}/api/QQBot?token=${QQBotImgToken}&name=${path.basename(filePath)}`

        // 使用QQ图床
        if (QQBotImgIP == "127.0.0.1" && type === "image") {
            const botList = Bot.adapter.filter(item => typeof item === "number")
            if (botList.length > 0) url = await common.uploadQQ(filePath, botList[0])
        }
        common.log("QQBotApi", `[生成文件] url：${url}`, "debug")
        return { type, file: url }
    }
}