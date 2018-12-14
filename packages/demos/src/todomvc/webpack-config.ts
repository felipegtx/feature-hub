import {join} from 'path';
import {Configuration} from 'webpack';
import {webpackBaseConfig} from '../webpack-base-config';

export default [
  {
    ...webpackBaseConfig,
    entry: join(__dirname, './main/index.tsx'),
    externals: {
      react: 'react'
    },
    output: {
      filename: 'feature-app-main.umd.js',
      libraryTarget: 'umd',
      publicPath: '/'
    }
  },
  {
    ...webpackBaseConfig,
    entry: join(__dirname, './header/index.ts'),
    externals: {
      react: 'react'
    },
    output: {
      filename: 'feature-app-header.umd.js',
      libraryTarget: 'umd',
      publicPath: '/'
    }
  },
  {
    ...webpackBaseConfig,
    entry: join(__dirname, './footer/index.tsx'),
    externals: {
      react: 'react'
    },
    output: {
      filename: 'feature-app-footer.umd.js',
      libraryTarget: 'umd',
      publicPath: '/'
    }
  },
  {
    ...webpackBaseConfig,
    entry: join(__dirname, './integrator.tsx'),
    output: {
      filename: 'integrator.js',
      publicPath: '/'
    }
  }
] as Configuration[];
