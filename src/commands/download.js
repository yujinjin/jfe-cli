/*
 * @创建者: yujinjin9@126.com
 * @创建时间: 2022-11-17 15:34:11
 * @最后修改作者: yujinjin9@126.com
 * @最后修改时间: 2022-11-29 17:25:48
 * @项目的路径: \jfe-cli\src\commands\download.js
 * @描述: 下载模板
 */
import path from "path";
import fs from "fs-extra";
import downloadGit from "download-git-repo";
import ora from "ora";
import chalk from "chalk";
import logSymbols from "log-symbols";
import inquirer from "inquirer";
import { fileURLToPath } from "url";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");

// 模板目录路径
export const templatesPath = path.resolve(__dirname, "./templates");

// 模板列表
const templateList = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./src/template-list.json"), "utf8"));

/**
 * @param directoryName 下载的模板目录名
 * @param url 下载的地址URL
 * @descripe 下载模板
 */
async function download(directoryName, url, isNew = false) {
    try {
        const exists = await fs.pathExists(templatesPath + "/" + directoryName);
        if (exists) {
            if (isNew) {
                // 如果该项目已经存在先进行清除
                await fs.remove(templatesPath + "/" + directoryName);
            } else {
                console.log(logSymbols.info, directoryName + "已下载过");
                return;
            }
        } else {
            await fs.mkdirs(templatesPath + "/" + directoryName);
        }
        await new Promise(resolve => {
            // Spinner 初始设置
            const downloadSpinner = ora(chalk.cyan("Downloading template " + directoryName));
            // 开始执行等待动画
            downloadSpinner.start();
            downloadGit(url, templatesPath + "/" + directoryName, async err => {
                if (err) {
                    // 下载失败时提示
                    downloadSpinner.text = chalk.red(`Download ${directoryName} template failed. ${err}`);
                    // 终止等待动画并显示 X 标志
                    downloadSpinner.fail();
                    await fs.remove(templatesPath + "/" + directoryName);
                    process.exit();
                }
                // 下载成功时提示
                downloadSpinner.text = "Download template " + directoryName + " successful.";
                // 终止等待动画并显示 ✔ 标志
                downloadSpinner.succeed();
                const exists = await fs.pathExists(templatesPath + "/" + directoryName + "/template.config.js");
                if (exists) {
                    fs.renameSync(templatesPath + "/" + directoryName + "/template.config.js", templatesPath + "/" + directoryName + ".config.js");
                }
                resolve();
            });
        });
    } catch (error) {
        await fs.remove(templatesPath + "/" + directoryName);
        console.log();
        console.log(logSymbols.error, error);
        // 退出进程
        process.exit();
    }
}

/**
 * @param templateName 下载的项目模板名称
 * @descripe 下载模板
 */
export default async function (templateName, isNew = false) {
    let findTemplate = null;
    if (templateName && templateName.trim()) {
        findTemplate = templateList.find(item => item.name === templateName.trim());
    }
    if (!findTemplate) {
        // 执行控制台交互
        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "template",
                message: templateName ? "项目模板名称不正确，请重新选择项目模板" : "请选择项目模板",
                choices: templateList.map((item, index) => ({ name: item.name + "(" + item.descripte + ")", value: index }))
            }
        ]);
        findTemplate = templateList[answers.template];
    }
    await download(findTemplate.name, findTemplate.link, isNew);
    
    return findTemplate.name;
}
