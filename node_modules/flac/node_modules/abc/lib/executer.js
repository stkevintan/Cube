// Ограничивает количество параллельно исполняемых действий
module.exports = function (limit) {
    var requestPool = [];
    var requestCount = 0;

    this.add = function (func) {
        requestPool.push(func);
        execute();
    };

    function execute () {
        if (requestCount < limit) {
            var func = requestPool.shift();
            if (func) {
                requestCount++;
                func(function () {
                    requestCount--;
                    execute();
                });
            }
       }
    }

};
