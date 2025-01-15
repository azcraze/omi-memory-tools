require('@babel/register')({
extensions: ['.js'],
presets: ['@babel/preset-env'],
plugins: [
    ['module-resolver', {
    root: ['./src'],
    alias: {
        '@': './src',
        '@utils': './src/utils',
        '@components': './src/components'
    }
    }]
]
});

