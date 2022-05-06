import { merge } from 'webpack-merge'
import commonConfiguration from './webpack.common.js'
import portFinderSync from 'portfinder-sync'

const result = merge(
  commonConfiguration,
  {
    mode: 'development',
    devServer: {
      port: portFinderSync.getPort(3000),
      static: './',
      open: true,
      https: false,
      allowedHosts: "all",
      client: {
        progress: true,
        overlay: true
      },
      hot: 'only'
    }
  }
);

export default result
