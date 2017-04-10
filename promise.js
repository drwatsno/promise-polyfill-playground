if (typeof Promise === 'undefined' || !Promise.then) {
    Promise = Redbird;
}

const PROMISE_PENDING = 'pending';
const PROMISE_FULFILLED = 'fulfilled';
const PROMISE_REJECTED = 'rejected';

function decorate(func, promise) {

    return (result, next) => {
        promise.result = func(result);

        if (promise.result instanceof Redbird || promise.result instanceof Promise) {
            promise.result.then(function (res) {
                promise.result = res;
                next();
            });
            return;
        }

        next();
    };
}

function Redbird(func) {
    const promise = this;

    promise._functionStack = [];
    promise.status = PROMISE_PENDING;

    func(
        result => promise.pick(0, result),
        err => promise.reject(err)
    )
}

Redbird.prototype.pushToStack = function (func) {
    const promise = this;

    promise._functionStack.push(decorate(func, promise));
};

Redbird.prototype.pick = function (index, result) {
    const promise = this;

    if (result) {
        promise.result = result;
    }

    const nextFunc = promise._functionStack[index + 1] ? promise.pick.bind(this, index + 1) : promise.end.bind(this, promise.result);

    promise._functionStack[index].call(this, promise.result, nextFunc);
};

Redbird.prototype.reject = function (err) {
    const promise = this;

    promise.status = PROMISE_REJECTED;
    promise.result = err;

    return promise;
};

Redbird.prototype.resolve = function () {
    return new Redbird(resolve => resolve());
};

Redbird.prototype.then = function (func) {
  const promise = this;

  promise.pushToStack(func);

  return promise;
};

Redbird.prototype.end = function (result) {
  const promise = this;

  promise.result = result;

  promise.status = PROMISE_FULFILLED;
};

const pr = new Redbird(function (resolve, reject) {
    setTimeout(function () {
        resolve('200');
    }, 500);
});

pr.then(function (result) {
    return result + 5;
}).then(function (result) {
    return new Redbird(function (resolve, reject) {
        setTimeout(function () {
            resolve(result * '200');
        }, 5000);
    });
}).then(function (result) {
    console.log(result);
});