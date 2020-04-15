(function(global, factory) {
    //* 判断是否有exports，module对象，从而判断它是否是符合commonJS规范的
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        //* 如果有的话就把这个工厂函数传过去,如果没有就继续判断,判断是否有define和define.amd
        // * 如果有就是引用了requireJS和seaJS,如果没有,就给全局window扩展一个Vue
        typeof define === 'function' && define.amd ? define(factory) :
        (global = global || self, global.Vue = factory());
})(this, function() { //* factory会拿到这个函数的返回值Vue,从而可以new一个Vue
    var ASSET_TYPES = [
        'component',
        'directive',
        'filter'
    ];
    /**
     * Check whether an object has the property.
     * 检查对象是否具有属性
     */
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key)
    }
    //* 全局配置对象
    var config = {
        optionMergeStrategies: Object.create(null),
    };
    /* 
     *自定义策略对象
     *strats拿到的是全局配置对象config里面的一个属性的值,并且这个值还是通过构造函数创造的纯对象
     *那么为什么不通过字面量的方式直接创建一个纯对象呢?
     *主要是为了利用config这个全局对象,使得strats在全局可使用
     */
    var strats = config.optionMergeStrategies;
    strats.el = function(parent, child, vm, key) {
        if (!vm) {
            /*
             * 这里要warn的原因在于el是只能出现在根实例上的,
             * 所以,如果在组件调用这个strats.el那么当然要warn,
             * 现在就需要进行判断,区别开根实例和组件
             * 根实例和组件的区别在于 在同一套代码模式中,组件是不接收vm的,
             * 所以这里判断没有vm那么就证明是组件使用的strats.el,就需要warn
             */
            warn(
                "option \"" + key + "\" can only be used during instance " +
                'creation with the `new` keyword.'
            );
        }
        //* vm有值则调用defaultStrat方法
        return defaultStrat(parent, child)
    }
    strats.data = function() {
        return function mergedInstanceDataFn() {

        }
    }

    //* 默认策略函数
    var defaultStrat = function(parentVal, childVal) {
        return childVal === undefined ?
            parentVal :
            childVal
    };

    //* 这个函数里面有三个参数
    function mergeOptions(parent, //* parent-->当前实例的父组件的选项,也就是Vue.options
        child, //* child-->当前实例的子组件的选项-->配置对象
        vm) { //* vm-->实例对象(如果是处理根实例下的选项那就有值,指向Vue的实例对象,处理组件选项时为undefined)
        var options = {};
        var key;
        for (key in parent) { //* 参数的指代关系:parent-->Vue.options-->ASSET_TYPES的选项加S
            mergeField(key); //* 这个函数又把遍历到的components,directives,filters进行处理,这个函数就是自定义策略函数
        }
        for (key in child) {
            if (!hasOwn(parent, key)) { //* 这里会判断配置对象里面的属性是否和parent里面的属性重叠
                mergeField(key);
            }
        }
        //* 自定义策略处理函数
        //* 该函数最终要确定的是options的值是什么
        function mergeField(key) { //* count
            //* 定义一个strat,检测strats上面是否有key,没有则把defaultStrat给它
            /*
             * strats代表自定义策略对象,该对象上存储的都是自定义策略函数
             * defaultStrat代表默认策略对象,
             */
            var strat = strats[key] || defaultStrat;
            /*
             * Vue.options.count  配置对象.count 
             * 默认策略函数接收前两个参数,自定义策略函数可能需要这4个参数
             * 所以定义这4个参数的模式是为了自定义策略函数使用的考虑
             */
            options[key] = strat(parent[key], child[key], vm, key);
        }
        return options;

    }
    //* 定义这个函数进行解读
    function resolveConstructorOptions(Ctor) { //* 这个参数接收vm.constructor就是Vue的构造函数
        var options = Ctor.options;
        return options
    }

    function initMixin() { //* 定义initMixin
        Vue.prototype._init = function(options) { //* 初始化时传入了配置对象
            var vm = this; //* 初始化的时候创建一个vm实例,把this绑定给这个实例
            //* 跳过性能监控的代码
            //* 给实例vm扩展一个$options的属性
            //* 所以在index.html中可以拿到vm.$options属性
            vm.$options = mergeOptions( //* 这个方法就是对选项进行处理,所以需要去定义这个方法
                resolveConstructorOptions(vm.constructor),
                options || {},
                vm
            );
        }
    }

    function initGlobalAPI(Vue) {
        // config
        var configDef = {};
        configDef.get = function() { //* 扩展访问器属性
            return config;
        }
        configDef.set = function() { //* 扩展访问器属性
            console.error(
                'Do not replace the Vue.config object, set individual fields instead.'
            );
        };
        //* 侦测你对于 Vue.config的操作
        Object.defineProperty(Vue, 'config', configDef);
    }



    function Vue(options) { //* 创建Vue实例的时候会传入一个配置对象
        //* 在创建Vue实例的时候,首先会判断this指向是否指向Vue实例
        if (!(this instanceof Vue)) {
            //* 如果不是则会提示一个警告信息
            warn('Vue is a constructor and should be called with the `new` keyword');
        }
        //* 如果是,则调用Vue原型对象上的方法vue.prototype._init
        //* 这个方法是定义在initMixin()方法下的 
        this._init(options);
    }
    //* 给Vue扩展一个options属性,这个属性初始赋值为一个空对象
    Vue.options = Object.create(null);
    //* 然后遍历ASSET_TYPES这个数组,给他加上s,
    //* 原数组里面每一项都是没有加s的,至于为什么不在定义的加上s
    //* 那是考虑到这个数组的复用性,有些地方就需要用到不加s的
    ASSET_TYPES.forEach(function(type) {
        Vue.options[type + 's'] = Object.create(null);
    });
    initMixin(Vue);
    initGlobalAPI(Vue);
    return Vue;
})