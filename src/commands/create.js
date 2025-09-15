/*
 * @创建者: yujinjin9@126.com
 * @创建时间: 2022-11-17 15:22:19
 * @最后修改作者: yujinjin9@126.com
 * @最后修改时间: 2022-11-29 16:50:48
 * @项目的路径: \jfe-cli\src\commands\create.js
 * @描述: 创建项目
 */
import path from "path";
import fs from "fs-extra";
import ora from "ora";
import chalk from "chalk";
import handlebars from "handlebars";
import symbols from "log-symbols";
import inquirer from "inquirer";
import downloadTemplate, { templatesPath } from "./download.js";
import { fileURLToPath } from "url";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");

// 验证工程目录路径
async function validateProjectDirectory(projectName, options) {
    try {
        if (!projectName || !projectName.trim()) {
            console.log(chalk.red("项目名不能为空，请重新输入"));
            const answers = inquirer.prompt([
                {
                    type: "input",
                    message: "项目名称:",
                    name: "projectName",
                    validate: function (input) {
                        if (!input) {
                            return chalk.red("请输入项目名称");
                        } else if (input.length < 3) {
                            return chalk.red("项目名称不能少于3个字符");
                        } else if (!/^[a-zA-Z0-9_\\-]+$/.test(input)) {
                            return chalk.red("项目名称只能包含字母、数字、下划线和中划线");
                        } else {
                            return true;
                        }
                    }
                }
            ]);
            projectName = answers.projectName;
        }

        // 获取当前工作目录
        const cwd = process.cwd();
        // 拼接得到项目目录
        const targetDirectory = path.join(cwd, projectName);

        const exists = await fs.pathExists(targetDirectory);
        if (exists) {
            // 项目重名时提醒用户
            // console.log(symbols.error, chalk.red("The project already exists."));
            // 判断是否使用 --force 参数
            if (options && options.force) {
                // 删除重名目录(remove是个异步方法)
                await fs.remove(targetDirectory);
            } else {
                let { isOverwrite } = await inquirer.prompt([
                    // 返回值为promise
                    {
                        name: "isOverwrite", // 与返回值对应
                        type: "list", // list 类型
                        message: "项目目录已存在，是否覆盖？",
                        choices: [
                            { name: "Overwrite", value: true },
                            { name: "Cancel", value: false }
                        ]
                    }
                ]);
                // 选择 Cancel
                if (!isOverwrite) {
                    console.log(symbols.info, chalk.blue("Cancel"));
                    process.exit();
                } else {
                    // 选择 Overwirte ，先删除掉原有重名目录
                    console.log(symbols.info, chalk.green("Removing"));
                    await fs.remove(targetDirectory);
                }
            }
        }
    } catch (error) {
        console.log(symbols.error, error);
        // 退出进程
        process.exit();
    }
    return projectName;
}

export default async function (projectName, options) {
    try {
        projectName = await validateProjectDirectory(projectName, options);
        const templateName = await downloadTemplate(null, false);
        const exists = await fs.pathExists(templatesPath + "/" + templateName + ".config.js");
        const questions = [
            {
                type: "input", // 类型，其他类型看官方文档
                name: "description", // 请输入项目描述
                message: "请输入项目描述",
                default: "" // 默认值，用户不输入时用此值
            },
            {
                type: "input", // 类型，其他类型看官方文档
                name: "author", // 请输入项目作者
                message: "请输入项目作者",
                default: "" // 默认值，用户不输入时用此值
            },
            {
                type: "number", // 类型，其他类型看官方文档
                name: "port", // 请输入项目作者
                message: "请输入项目运行端口号",
                default: 8080 // 默认值，用户不输入时用此值
            },
            {
                type: "confirm", // 类型，其他类型看官方文档
                name: "open", // 请输入项目作者
                message: "是否在服务器已经启动后开启浏览器",
                default: false // 默认值，用户不输入时用此值
            }
        ];
        const compileFiles = ["/package.json", "/.env"];
        const scripts = ["mserve", "serve", "build"];
        if (exists) {
            const templateConfig = (await import(`file://${templatesPath}/${templateName}.config.js`)).default;
            if (templateConfig.compileFiles?.length) {
                compileFiles.splice(0, compileFiles.length, ...templateConfig.compileFiles);
            }
            if (templateConfig.scripts?.length) {
                scripts.splice(0, scripts.length, ...templateConfig.scripts);
            }
            if (templateConfig.questions?.length) {
                questions.splice(
                    0,
                    questions.length,
                    ...templateConfig.questions.map(item => {
                        if (item.validate) {
                            return {
                                ...item,
                                validate: function (input) {
                                    const message = item.validate(input);
                                    if (message) {
                                        return chalk.red(message);
                                    }
                                    return true;
                                }
                            };
                        } else {
                            return { ...item };
                        }
                    })
                );
            }
        }
        const answers = await inquirer.prompt(questions);
        // Spinner 初始设置
        const spinner = ora(chalk.cyan("Initializing project..."));
        // 开始执行等待动画
        spinner.start();
        // 拼接 template 文件夹路径
        const templatePath = path.resolve(__dirname, "./templates/" + templateName);
        const targetPath = path.join(process.cwd(), projectName);

        // 等待复制好模板文件到对应路径去
        await fs.copy(templatePath, targetPath);

        // 把要替换的模板字符准备好
        const multiMeta = {
            projectName,
            ...answers
        };

        // 把要替换的文件准备好
        // const multiFiles = [`${targetPath}/package.json`, `${targetPath}/.env`];
        // 用条件循环把模板字符替换到文件去
        for (var i = 0; i < compileFiles.length; i++) {
            // 这里记得 try {} catch {} 哦，以便出错时可以终止掉 Spinner
            try {
                // 等待读取文件
                const compileFilesContent = await fs.readFile(`${templatePath}/${compileFiles[i]}`, "utf8");
                // 等待替换文件，handlebars.compile(原文件内容)(模板字符)
                const compileFilesResult = await handlebars.compile(compileFilesContent)(multiMeta);
                // 等待输出文件
                await fs.outputFile(`${targetPath}/${compileFiles[i]}`, compileFilesResult);
            } catch (err) {
                // 如果出错，Spinner 就改变文字信息
                spinner.text = chalk.red(`Initialize project failed. ${err}`);
                // 终止等待动画并显示 X 标志
                spinner.fail();
                // 退出进程
                process.exit();
            }
        }
        // 如果成功，Spinner 就改变文字信息
        spinner.text = "Initialize project successful.";
        // 终止等待动画并显示 ✔ 标志
        spinner.succeed();
        console.log("To get started:");
        console.log(`\r\ncd ${chalk.yellow(projectName)}`);
        scripts.forEach(item => {
            console.log(`\r\n   ${chalk.yellow("npm run " + item)} `);
        });
    } catch (error) {
        console.info();
        console.log(symbols.error, error);
        // 退出进程
        process.exit();
    }
}
