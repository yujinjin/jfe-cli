/*
 * @创建者: yujinjin9@126.com
 * @创建时间: 2022-11-17 15:29:45
 * @最后修改作者: yujinjin9@126.com
 * @最后修改时间: 2022-11-29 16:38:18
 * @项目的路径: \jfe-cli\src\commands\upgrade.js
 * @描述: 更新指令
 */
import path from "path";
import fs from "fs-extra";
import updateNotifier from "update-notifier";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");

// 引入 package.json 文件，用于 update-notifier 库读取相关信息
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./package.json"), "utf8"));

// updateNotifier 是 update-notifier 的方法，其他方法可到 npmjs 查看
const notifier = updateNotifier({
    //从 package.json 获取 name 和 version 进行查询
    pkg, // 设定检查更新周期，默认为 1000 * 60 * 60 * 24（1 天）
    updateCheckInterval: 1000 //这里设定为 1000 毫秒（1秒）
});

export default function () {
    // 当检测到版本时，notifier.update 会返回 Object
    // 此时可以用 notifier.update.latest 获取最新版本号
    if (notifier.update) {
        console.log(`New version available: ${chalk.cyan(notifier.update.latest)}, it's recommended that you update before using.`);
        notifier.notify();
    } else {
        console.log(chalk.green("No new version is available."));
    }
}
