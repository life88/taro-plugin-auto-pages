import fs from 'fs';
import glob from 'glob';
import chokidar from 'chokidar';
import {IPluginContext} from '@tarojs/service';
import winPath from "./utils/winPath";

const INDEX_PAGE = 'pages/index/index';

const getPageFiles = (sourcePath: string) => {
  const files = glob.sync(`${sourcePath}/**/index.?(vue|js?(x)|ts?(x))`);
  const pages = (files || []).map((file: any) => {
    return file.replace(`${sourcePath}/`, '').replace(/index\.(vue|tsx?|jsx?)$/, 'index');
  });
  const idx = pages.indexOf(INDEX_PAGE);
  if(idx > -1){
    pages.splice(idx, 1);
    pages.unshift(INDEX_PAGE);
  }
  return pages;
}

const buildTempPages = (sourcePath: string, chalk: any) => {
  const pagesFileName = `${sourcePath}/.temp/pages.js`;
  const pages = getPageFiles(sourcePath);
  const tpl = `module.exports = ${JSON.stringify(pages, null, 2)};`;
  fs.writeFileSync(pagesFileName, tpl);
  console.log(`${chalk.blue('生成')}  配置文件  ${pagesFileName}`);
}

const checkPage = (path: string) => {
  return /(.*)\/index\.(vue|tsx?|jsx?)$/.test(winPath(path));
}

const watchPagesPath = (sourcePath: string, chalk: any) => {
  const watch = chokidar.watch(`${sourcePath}/pages/`).on('all', (event, path) => {
    let type;
    switch(event){
      case "add":
      case "unlink":
        if(checkPage(path)){
          type = event;
        }
        break;
      default:
    }
    if(type){
      console.log(`${chalk.blue(type === 'add' ? '添加' : '删除')}  page  ${winPath(path)}`);
      buildTempPages(sourcePath, chalk);
    }
  });

  return () => watch.close();
}

export default (ctx: IPluginContext) => {
  const sourcePath = winPath(ctx.paths.sourcePath);
  const chalk = ctx.helper.chalk;
  const appJsonFileName = 'app.json';
  let closeWatch: () => Promise<void>;

  ctx.onBuildStart(() => {
    const tmpPath = `${sourcePath}/.temp`;
    if(!fs.existsSync(tmpPath)){
      fs.mkdirSync(tmpPath);
    }

    buildTempPages(sourcePath, chalk);

    closeWatch = watchPagesPath(sourcePath, chalk);
  });

  ctx.modifyBuildAssets((args: any) => {
    const appSource = args.assets[appJsonFileName].source();
    const pages = getPageFiles(sourcePath);

    const appJson = JSON.parse(appSource);
    appJson.pages = pages;

    args.assets[appJsonFileName].source = () => {
      return JSON.stringify(appJson);
    };
  });

  ctx.onBuildFinish(() => {
    if(process.env.NODE_ENV === 'production'){
      closeWatch && closeWatch();
    }
  })
};
