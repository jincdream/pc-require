 (function(exports,doc){
   var win = exports
   var each = (function(){
     var f = [].forEach
     if(f){
       return function(ary,cb){
         if(!cb || !ary)return;
         f.call(ary, cb)
       }
     }else{
       return function(ary,cb){
         if(!cb || !ary)return;
         var ln = ary.length
         var i = 0
         while(ln--){
           cb(ary[i], i++);
         }
       }
     }
   })()
   var log = function(){
     win.console && win.console.log(arguments)
   }

   var _SCRIPT_   = doc.createElement('script')
   var _HEAD_     = doc.head || doc.getElementsByTagName('head')[0]
   var loadEvent  = 'onload'
   var useOnload  = loadEvent in _SCRIPT_
   var loadEvent  = useOnload ? loadEvent : 'onreadystatechange'
   var readyState = /complete|loaded/

   var Source = function(id,name,fn){
     var _self = this
     _self.fns = [fn]
     _self.status = -1
     _self.id = id
     _self._name = name
   }

   Source.prototype = {
     constructor: Source,
     addFn: function(fn){
       this.fns.push(fn)
     },
     setStatus:function(n){
       this.status = n
     },
     load: function(id,src,charset,bind){
       var _self    = this
       var isScript = /\.js$|\.js\?.*|\.js\?/.test(src)
       var type     = isScript ? 'javascript' : 'css'
       var source   = doc.createElement(isScript ? 'script' : 'link')
       var index    = 0,loadID
       var onload   = function(){
         _self.fire(bind)
         isScript && _HEAD_.removeChild(source)
         source = null
       }
       _self.id   = source.id = id
       source[loadEvent] = useOnload ? onload : function(){
         if (readyState.test(source.readyState)) {
             ++index
             if (index === 1) {
                 loadID = win.setTimeout(onload, 500)
             } else {
                 win.clearTimeout(loadID)
                 onload()
             }
         }
       }

       source.charset = charset
       source.setAttribute('type','text/' + type)
       if(isScript){
        source.setAttribute('async','true')
        source.src = src
       }else{
        source.setAttribute('rel','stylesheet')
        source.href = src
       }
       _HEAD_.appendChild(source)
       source.onError = function(){
         win.clearTimeout(loadID);
         log(id,src,url,' is load error')
         _HEAD_.removeChild(source)
         source = null
       }
       _self.setStatus(0)
     },
     fire: function(bind){
       var _self = this
       each(_self.fns,function(fn,i){
         fn.call(bind || null,_self._name)
       })
       _self.setStatus(1)
     }
   }
   var Sources = function(){
     var _self = this
     _self.point = 0
     _self.source = {}
   }
   Sources.prototype = {
     constructor: Sources,
     create: function(name,fn){
       var _self = this
       var _s = _self.source[name] = new Source(_self.point++,name,fn)
       return _s
     },
     get: function(name,next){
       var _self = this
       var source = _self.source[name]
       if(!source){
         source = _self.create(name,next)
       }
       return source
     }
   }
   var _sources = new Sources
   var loadSource = function(src,next,charset,_name) {
     var name = _name || src
     var cs = charset || doc.charset
     var source = _sources.get(name,next)
     var status = source.status
     var id = 'js-id-' + (+new Date)
     switch (status) {
       case -1:
         source.load(id,src,charset)
         break;
       case 0:
         source.addFn(next)
         break;
       case 1:
         source.fire()
         break;
       default:
       break;
     }
     return id
   }

   var module = {}
   module.mods = {}
   module._path = {}
   module._short = {}
   module.w = {}
   module.config = function(config){
     var n
     var _short
     var _self      = this
     var _base      = config.domain || _self._baseUrl || ''
     var _deps      = config.deps
     var _combo     = config.combo
     var _comboUrl  = config.comboUrl
     var _path      = config.path
     var _alies     = config.alies
     for (n in _path) {
       var path = _self._path[n] = _self._path[_path[n]] = {}
       path.src = _path[n]
       path.callback = []
     }
     for (_short in _alies){
       _self._short[_short] = _alies[_short]
     }
     _self._baseUrl = _base
     _deps     && (_self._deps     = _deps)
     _combo    && (_self._combo    = _combo)
     _comboUrl && (_self._comboUrl = _comboUrl)
    }
    var _getDeps = function(name){
     var mDeps = module._deps || {}
     var deps = mDeps[name]
     var rz = []
     deps && each(deps,function(dep,i){
       var otherDep = mDeps[dep]
       otherDep && rz.push.apply(rz,otherDep)
     })
     rz.push.apply(rz,deps || [])
     return rz
    }
    
    var require = function(names, cb , charset , _noCombo) {
     var _self    = module
     var mods     = _self.mods
     var path     = _self._path
     var baseUrl  = _self._baseUrl
     var src      = ''
     var loads    = []
     var cssLoad  = []
     var callback = function(){
       var fn = []
       each(loads,function(name,i){
         name = _self._short[name] || name
         var mod = mods[name]
         mod.factory && mod.factory()
       })
       each(names,function(name,i){
         name = _self._short[name] || name
         fn[i] = mods[name].exports
       })
       cb.apply(null, fn)
     }
     each(names,function(name,i){
       loads.push.apply(loads,_getDeps(name))
     })
     loads.push.apply(loads,names)
     var len = loads.length
     ;(!_self._combo || _noCombo) && each(loads, function(name, i, ary) {
       // if(mods[name].exports)
       name         = _self._short[name] || name
       var mod      = mods[name]
       var thisPath = path[name]
       var loadSrc  = thisPath ? baseUrl + thisPath.src : name
       // thisPath&&console.info(thisPath.src.replace(/(?:^\.\/|^\.)/,''))
       if (mod && mod.loaded) {
         if (--len === 0) callback()
       } else {
         // if (!path[name]) throw new Error(name + 'is not define by module.')
         src = loadSrc
         loadSource(src, function(src) {
           if(!mods[name])mods[name] = {}
           mods[name].loaded = !0
           if (--len === 0) callback()
         },charset || doc.charset,name)
       }
     })
     if(_self._combo && !_noCombo){
       var combo = []
       var comboCss = []
       each(loads, function(name, i){
         name = _self._short[name] || name
         var mod = mods[name]
         if(!mod || !mod.loaded){
           var src = path[name].src.replace(/(?:^\.\/|^\.)/,'')
           var isJs = /\.js$/.test(src)
           if(!path[name]) throw new Error(name + 'is not define by module.')
           isJs ? combo.push(src) : comboCss.push(src)
         }
       })
       log(baseUrl)
       console.log(baseUrl,(baseUrl + _self._comboUrl || '')+combo.join(','))
       combo.length ? loadSource((baseUrl + _self._comboUrl || '')+combo.join(','),callback,charset || doc.charset,combo.join(',')) : callback()
       comboCss.length && loadSource((baseUrl + _self._comboUrl || '')+combo.join(','),function(){log('css loaded')},charset || doc.charset,combo.join(','))
     }
     // console.log(_self._comboUrl+combo.join(','))
    }
    var _require = function(name){
     var mod = module.mods[name]
     mod.factory && mod.factory()
     return mod.exports
    }
    
    require.config = function(config){
     module.config(config)
    }
    var _promise = function(fn,_bind){
      var _self = this
      _self.fns = []
      _self.catchs = []
      _self.main = fn
      _self._bind = _bind || null
      return _self
    }
    _promise.prototype.wrap = function(fn){
      var _self = this
      if(!fn && !_self.main)return;
      if(fn)_self.main = fn;
      var id = (+new Date).toString(32)
      _self.main.apply(_self._bind,[function resolve(data){
              _self.resolve(data)
            },function reject(data){
              _self.reject(data)
            }])
      _self.main = null
    }
    _promise.prototype.resolve = function(data){
      this.trigger(data)
    }
    _promise.prototype.reject = function(data){
      this.trigger(data,!0)
    }
    _promise.prototype._catch = function(fn){
      this.catchs.push(fn)
      return this
    }
    _promise.prototype.then = function(fn){
      var _self = this
      _self.fns.push(fn)
      _self.wrap()
    }
    _promise.prototype.trigger = function(data,isCatch){
      var _self = this
      var fn = isCatch ? _self.catchs.shift() : _self.fns.shift()
      return fn.apply(_self,data);
    }
    // var Promise = win.Promise || _promise
    var Promise = _promise
    // (new _promise(function(resolve){setTimeout(function(){resolve(111)},500);console.log(222)})).then(function(data){console.log(data)})
    var async = function(names,option){
      var option = option || {};
      return new Promise(function(resolve,reject){
        if('' + names === names)names = [names];
        require(names,function(){
          var args = [].slice.call(arguments,0)
          resolve.call(null,args)
        },option.charset,option.combo)
      }) 
    }
    _require.async = async
    _require.config = function(config){
      module.config(config)
    }

    var define = function(name,deps,fn){
     !fn && (fn = deps,deps = [])
     var _name = name.split('|')
     var _short = _name[0]
     var _ln = _name.length > 1
     var id = _ln ? _name[1] : _short
     var m = module
     var o = m.mods[id] = {};
     var e = o.exports = {};
     _ln && (m._short[_short] = id)
     o.factory = function(){
       fn.apply(m.w,[_require, e, o]);
       delete this.factory
     }
     o.loaded = !0
    }

    exports.define = define
    exports.require = _require
     // exports. = module
 })(window,document)