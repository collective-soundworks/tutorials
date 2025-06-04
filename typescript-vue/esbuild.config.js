import Vue from 'unplugin-vue/esbuild'

export default function(buildOptions) {
  if (!Array.isArray(buildOptions.plugins)) {
    buildOptions.plugins = [];
  }

  buildOptions.plugins.unshift(Vue());

  return buildOptions;
}
