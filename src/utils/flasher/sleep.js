
exports.msleep = (ms)=>{
    return new Promise((resolve)=>{
        setTimeout(resolve, ms);
    });
}