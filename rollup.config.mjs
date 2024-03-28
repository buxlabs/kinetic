import babel from "@rollup/plugin-babel"
import terser from "@rollup/plugin-terser"

export default {
  input: "index.js",
  output: {
    file: "build/index.js",
    format: "umd",
    name: "Kinetic",
  },
  plugins: [
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              browsers: ["last 2 versions", "ie >= 8"],
            },
            modules: false,
          },
        ],
      ],
      plugins: ["@babel/plugin-transform-object-assign"],
    }),
    terser(),
  ],
}
