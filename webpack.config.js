const path = require('path');

const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const VueLoaderPlugin = require('vue-loader/lib/plugin');
const DotEnv = require('dotenv-webpack');

const config = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader",
                options: {
                    loaders: {
                        'scss': 'vue-style-loader!css-loader!sass-loader',
                        'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
                    }
                }
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                },
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ]
            }
        ],
    },
    resolve: {
        extensions: [ '.ts', '.js', '.json', '.vue' ],
        alias: {
            'vue$': 'vue/dist/vue.esm.js'
        }
    },
    output: {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [ // Clean the previously generated bundles.
                '**/*',
                '!.gitignore',
                '!images',
                '!images/**/*',
                '!modalities',
                '!modalities/**/*',
            ]
        }),
        new HtmlWebpackPlugin({
            title: "Carcassonne"
        }),
        new VueLoaderPlugin(),
        new DotEnv({
            path: './.env',
            safe: true
        }),
    ]
};

module.exports = (env, argv) => {
    if (argv.mode === "development") {
        // https://webpack.js.org/configuration/devtool/
        config.devtool = "inline-source-map";
    }
    return config;
};
