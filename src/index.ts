import fs from 'fs';
import glob from 'glob';
import {IPluginContext} from '@tarojs/service';
import winPath from "./utils/winPath";

const getPageFiles = (sourcePath: string) => {
  const files = glob.sync(`${sourcePath}/**/index.?(vue|js?(x)|ts?(x))`);
  return (files || []).map((file: any) => {
    return file.replace(`${sourcePath}/`, '').replace(/index\.(vue|tsx?|jsx?)$/, 'index');
  });
}

export default (ctx: IPluginContext) => {
  ctx.onBuildStart(() => {
    const sourcePath = winPath(ctx.paths.sourcePath);
    const tmpPath = `${sourcePath}/.temp`;
    if(!fs.existsSync(tmpPath)){
      fs.mkdirSync(tmpPath);
    }

    const pagesFileName = `${tmpPath}/pages.js`;
    const pages = getPageFiles(sourcePath);
    const tpl = `module.exports = ${JSON.stringify(pages, null, 2)};`;
    fs.writeFileSync(pagesFileName, tpl);
    const chalk = ctx.helper.chalk;
    console.log(`${chalk.blue('生成')}  配置文件  ${pagesFileName}`);
  });
};
