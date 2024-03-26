// generateProtos.js written by chatgpt
import { execSync } from 'child_process'
import glob from 'glob'

// 使用 glob 模块来匹配所有 .proto 文件
let protoFiles = glob.sync('kritor\\protos\\*.proto').join(' ') + ' '
protoFiles += glob.sync('kritor\\protos\\*\\*.proto').join(' ')
// 构建 pbjs 命令
const command = `npx pbjs -t static-module -w es6 -p ./kritor/protos -o ./generated/compiled.js ${protoFiles}`

// 执行命令
execSync(command, { stdio: 'inherit' })
