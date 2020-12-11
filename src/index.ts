import * as fs from "fs";
import glob from 'glob';
import winPath from './utils/winPath';

const INDEX_PAGE = 'pages/index/index';

interface IPluginOptions {
  indexPath: string,
}

interface IOptions {
  ctx: any,
  indexPath: string,
}

class TaroPluginAutoPage {
  static readonly pluginName: string = 'TaroPluginAutoPage';
  private ctx: any;
  private indexPath: string;
  private appJsonFileName: string;
  private sourcePath: string;
  private chalk: any;
  private chokidar: any;

  constructor(props: IOptions) {
    const {ctx, indexPath = INDEX_PAGE} = props;
    const {chalk, chokidar} = ctx.helper;
    this.ctx = ctx;
    this.indexPath = indexPath;
    this.appJsonFileName = 'app.json';
    this.sourcePath = winPath(ctx.paths.sourcePath);
    this.chalk = chalk;
    this.chokidar = chokidar;
  }

  checkPage(path: string) {
    return /(.*)\/index\.(vue|tsx?|jsx?)$/.test(winPath(path));
  }

  getPageFiles() {
    const files = glob.sync(`${this.sourcePath}/pages/**/index.?(vue|js?(x)|ts?(x))`);
    const pages = (files || []).map((file: string) => {
      return file.replace(`${this.sourcePath}/`, '').replace(/index\.(vue|tsx?|jsx?)$/, 'index');
    });
    const idx = pages.indexOf(this.indexPath);
    if (idx > -1) {
      pages.splice(idx, 1);
      pages.unshift(this.indexPath);
    } else {
      console.log(`${this.chalk.yellow(`${TaroPluginAutoPage.pluginName} 插件[indexPath]参数配置无效[${this.indexPath}]`)}`)
    }
    return pages;
  }

  buildTempPages() {
    const pagesFileName = `${this.sourcePath}/.temp/pages.js`;
    const pages = this.getPageFiles();
    const tpl = `module.exports = ${JSON.stringify(pages, null, 2)};`;
    fs.writeFileSync(pagesFileName, tpl);
    console.log(`${this.chalk.blue('生成')}  配置文件  ${pagesFileName}`);
  }

  watchPagesPath() {
    const watcher = this.chokidar.watch(`${this.sourcePath}/pages/`, {ignoreInitial: true}).on('all', (event: string, path: string) => {
      let type;
      switch (event) {
        case "add":
        case "unlink":
          if (this.checkPage(path)) {
            type = event;
          }
          break;
        default:
      }
      if (type) {
        console.log(`${this.chalk.blue(type === 'add' ? '添加' : '删除')}  发现页面  ${winPath(path)}`);
        this.buildTempPages();
      }
    });

    process.once('SIGINT', async () => {
      await watcher.close()
    })
  }

  install() {
    this.ctx.onBuildStart(() => {
      const tmpPath = `${this.sourcePath}/.temp`;
      if (!fs.existsSync(tmpPath)) {
        fs.mkdirSync(tmpPath);
      }

      this.buildTempPages();

      if (process.env.NODE_ENV !== 'production') {
        this.watchPagesPath();
      }
    })

    this.ctx.modifyBuildAssets((args: any) => {
      if(this.ctx.runOpts.platform === 'h5') return;

      const appSource = args.assets[this.appJsonFileName].source();
      const pages = this.getPageFiles();

      const appJson = JSON.parse(appSource);
      appJson.pages = pages;

      args.assets[this.appJsonFileName].source = () => {
        return JSON.stringify(appJson);
      };
    })
  }
}

export default function (ctx: any, ops: IPluginOptions) {
  const plugin = new TaroPluginAutoPage({ctx, ...ops});
  plugin.install();
}
