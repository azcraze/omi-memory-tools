require('@babel/register')({
    presets: ['@babel/preset-env'],
    plugins: [
        ['module-resolver', {
            root: ['../'],
            alias: {
                '@': './',
                '@utils': './utils',
                '@logger': './utils/logger.js',
                '@config': './config.js',
                '@conversations': './data/conversations.json',
                '@scripts': './scripts',
                '@modules': './src/modules',
                '@errors': './src/utils/customErrors.js',
                '@globals': './src/utils/globalVariables.js'
            }
        }]
    ],
    extensions: ['.js', '.jsx', '.ts', '.json']
});