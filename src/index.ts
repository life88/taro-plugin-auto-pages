import fs from 'fs';
import glob from 'glob';
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

const watchPagesPath = ({ chokidar, chalk, sourcePath } : {  chokidar: any, chalk: any, sourcePath: string }) => {
  const watcher = chokidar.watch(`${sourcePath}/pages/`, { ignoreInitial: true }).on('all', (event: any, path: string) => {
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
      console.log(`${chalk.blue(type === 'add' ? '添加' : '删除')}  发现页面  ${winPath(path)}`);
      buildTempPages(sourcePath, chalk);
    }
  });

  process.once('SIGINT', async () => {
    await watcher.close()
  })
}

export default (ctx: IPluginContext) => {
  const sourcePath = winPath(ctx.paths.sourcePath);
  const { chalk, chokidar } = ctx.helper;
  const appJsonFileName = 'app.json';

  ctx.onBuildStart(() => {
    const tmpPath = `${sourcePath}/.temp`;
    if(!fs.existsSync(tmpPath)){
      fs.mkdirSync(tmpPath);
    }

    buildTempPages(sourcePath, chalk);

    if(process.env.NODE_ENV !== 'production'){
      watchPagesPath({ chokidar, chalk, sourcePath });
    }
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
};
