/*
 * @创建者: yujinjin9@126.com
 * @创建时间: 2022-11-17 14:50:21
 * @最后修改作者: yujinjin9@126.com
 * @最后修改时间: 2022-11-17 14:51:53
 * @项目的路径: \jfe-cli\.eslintrc.js
 * @描述: eslint 配置
 */
module.exports = {
    "root": true,
    "env": {
      "node": true,
      "commonjs": true
    },
    "extends": ["prettier"],
    "parser": "@babel/eslint-parser",
    "parserOptions": {
      "ecmaVersion": 2015
    },
    "rules": {
        "no-use-before-define": "off",
        "no-unused-vars": [
            "error",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_"
            }
        ],
        "space-before-function-paren": "off",
    }
  }