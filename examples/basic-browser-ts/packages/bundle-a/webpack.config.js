const path = require('path');
const GenerateManifestPlugin = require('@pandino/webpack-plugin-generate-manifest');

module.exports = {
  experiments: {
    outputModule: true,
  },
  entry: {
    'bundle-a': './src/index.ts',
  },
  mode: 'production',
  devtool: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    library: {
      name: 'umd-bundle-ts',
      type: 'umd',
      umdNamedDefine: true,
    },
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new GenerateManifestPlugin(),
  ],
};
