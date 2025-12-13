module.exports = {
    apps: [
        {
            name: 'mentor-backend',
            cwd: './apps/backend',
            script: 'dist/index.js',
            env: {
                NODE_ENV: 'production',
                PORT: 5000
            }
        },
        {
            name: 'mentor-frontend',
            cwd: './apps/frontend',
            script: 'node_modules/next/dist/bin/next',
            args: 'start -p 80',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
