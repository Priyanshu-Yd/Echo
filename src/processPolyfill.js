window.process = {
    env: {
        NODE_ENV: 'development'
    },
    nextTick: (callback) => {
        setTimeout(callback, 0);
    }
}; 