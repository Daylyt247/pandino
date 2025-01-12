import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import {generateOutputs} from "../../../rollup/rollup-utils.mjs";

export default {
  input: 'src/index.ts',
  output: [
    ...generateOutputs('umd-activator-resolver-dom', ['esm', 'system']),
  ],
  plugins: [
    clear({
      targets: ['dist'],
    }),
    nodeResolve(),
    typescript(),
  ],
};
