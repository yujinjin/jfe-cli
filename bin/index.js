#!/usr/bin/env node
/*
 * @创建者: yujinjin9@126.com
 * @创建时间: 2022-11-17 10:59:56
 * @最后修改作者: yujinjin9@126.com
 * @最后修改时间: 2022-11-29 16:37:27
 * @项目的路径: \jfe-cli\bin\index.js
 * @描述: node 执行的脚本
 */
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import figlet from "figlet";
import { program } from "commander";
import upgrade from "../src/commands/upgrade.js";
import download from "../src/commands/download.js";
import create from "../src/commands/create.js";
import { fileURLToPath } from "url";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");

const { name, version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./package.json"), "utf8"));

// 从 package.json 文件中请求 version 字段的值，-v和--version是参数
program.version(name + ": " + version, "-v, --version");

// 帮助命令
program.on("--help", function () {
    console.log(
        "\r\n" +
            figlet.textSync(name, {
                font: "3D-ASCII",
                horizontalLayout: "default",
                verticalLayout: "default",
                width: 80,
                whitespaceBreak: true
            })
    );
    // 前后两个空行调整格式，更舒适
    console.log();
    console.log(`Run ${chalk.cyan(name + " <command> --help")} for detailed usage of given command.`);
    console.log();
});

// upgrade 检测更新
program
    // 声明的命令
    .command("upgrade")
    .alias("u")
    // 描述信息，在帮助信息时显示
    .description("Check the " + name + " version.")
    .action(() => {
        // 执行 lib/update.js 里面的操作
        // require("../src/commands/upgrade")();
        upgrade();
    });

// template 下载/更新模板
program
    .command("download <template_name>")
    .alias("d")
    .description("Download template for project.")
    .action(templateName => {
        download(templateName);
    });

// 创建一个项目
program
    .name(name)
    .usage("<commands> [options]")
    .command("create <project_name>")
    .alias("c")
    .description("Create a new front end project.")
    .option("-f, --force", "overwrite target directory if it exists") // 强制覆盖
    .action(project => {
        create(project);
    });

// 解析命令行参数
program.parse(process.argv);
