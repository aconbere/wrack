var MixpanelLib = function (q,r) {
  var api = {}
    , super_props_loaded = false;
  
  api.config = { cross_subdomain_cookie: true
               , cookie_name: "mp_super_properties"
               , test: false
               , store_google: false
               , debug: false
               };

  api.super_properties = { "all": {}
                         , "events": {}
                         , "funnels": {}
                         };

  api.funnels = {};

  api.send_request = function (path, data) {
    var callback = api.callback_fn;

    if (path.indexOf("?")>-1) {
      path += "&callback="
    } else {
      path += "?callback="
    }
    
    path += callback + "&";

    if (data) {
      path += api.http_build_query(data)
    }
    
    if (api.config.test) {
      path += '&test=1'
    }
    
    path += '&_=' + new Date().getTime().toString();
    
    var d = document.createElement("script");
    d.setAttribute("src", path);
    d.setAttribute("type", "text/javascript");
    var e = document.getElementsByTagName("head")[0] || document.documentElement;
    e.insertBefore(d,e.firstChild)
  };
    
  api.track_funnel = function (funnel, step, goal, properties, callback) {
    if (!properties) { properties = {} }
    properties.funnel = funnel;
    properties.step = parseInt(step,10);
    properties.goal = goal;

    if (properties.step==1) {
      if (document.referrer.search('http://(.*)google.com')===0) {
        var query = api.get_query_param(document.referrer, 'q');
        if (query.length) {
          api.register({ 'mp_keyword': query }, 'funnels')
        }
      }
    }
    
    api.track('mp_funnel', properties, callback, "funnels")
  };
  
  api.get_query_param = function (uri,b) {
    param = param.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var c= "[\\?&]" + param + "=([^&#]*)";
    var d = new RegExp(c);
    var val = d.exec(uri);
    
    if (val === null || (val && typeof(val[1]) != 'string' && val[1].length)) {
      return ''
    } else {
      return unescape(val[1]).replace(/\+/g,' ')
    }
  };
  
  api.track = function (event, properties, callback, d) {
    api.load_super_once();
    
    if (!d) {
      d = "events"
    }
    
    if (!properties) {
      properties = {}
    }
    
    if (!properties.token) {
      properties.token = api.token
    }
    
    if (callback) {
      api.callback = callback
    }
    
    properties.time = api.get_unixtime();
    api.save_campaign_params();

    var p;

    if (d!="all") {
      for (p in api.super_properties[d]) {
        if(!properties[p]){
          properties[p]=api.super_properties[d][p]
        }
      }
    }
    
    if (api.super_properties.all) {
      for (p in api.super_properties.all) {
        if (!properties[p]) {
          properties[p] = api.super_properties.all[p]
        }
      }
    }
    
    var e = { 'event': event 
            , 'properties': properties
            };

    var f = api.base64_encode(api.json_encode(e));

    if (api.config.debug){
      if (window.console) {
        console.log("-------------- REQUEST --------------");
        console.log(e)
      }
    }
    
    api.send_request(api.api_host + '/track/', { 'data': f
                                               , 'ip': 1
                                               });
    
    api.track_predefined_funnels(event, properties)
  };
  
  api.identify = function (a) {
    api.register_once({ 'distinct_id': a}, 'all', null, 30)
  };
  
  api.register_once = function (a, b, c, d) {
    api.load_super_once();

    if (!b || !api.super_properties[b]) {
      b = "all"
    }
    
    if (!c) {
      c = "None"
    }
    
    if (!d) {
      d=7
    }
    
    if (a) {
      for (var p in a) {
        if (a.hasOwnProperty(p)) {
          if (!api.super_properties[b][p] || api.super_properties[b][p] == c) {
            api.super_properties[b][p] = a[p]
          }
        }
      }
    }
    
    if (api.config.cross_subdomain_cookie) {
      api.clear_old_cookie()
    }
    
    api.set_cookie(api.config.cookie_name, api.json_encode(api.super_properties), d, api.config.cross_subdomain_cookie)
  };
  
  api.register = function (a,b,c) {
    api.load_super_once();
    
    if (!b || !api.super_properties[b]) {
      b = "all"
    }
    
    if (!c) {
      c = 7
    }
    
    if (a) {
      for (var p in a) {
        if (a.hasOwnProperty(p)) {
          api.super_properties[b][p] = a[p]
        }
      }
    }
    
    if (api.config.cross_subdomain_cookie) {
      api.clear_old_cookie()
    }
    
    api.set_cookie(api.config.cookie_name, api.json_encode(api.super_properties), c, api.config.cross_subdomain_cookie)
  };
  
  api.http_build_query = function (data, seperator) {
    var c
      , use_val
      , use_key
      , i = 0
      , tmp_arr = [];
    
    if (!seperator) {
      seperator = '&'
    }
    
    for (c in data) {
      if (c) { 
        use_val = encodeURIComponent(data[c].toString());
        use_key = encodeURIComponent(c);
        tmp_arr[i++] = use_key + '=' + use_val
      }
    }
    
    return tmp_arr.join(seperator)
  };
  
  api.get_unixtime = function () {
    return parseInt(new Date().getTime().toString().substring(0,10),10)
  };
  
  api.jsonp_callback = function (a) {
    if (api.callback) {
      api.callback(a);
      api.callback = false
    }
  };
  
  api.json_encode = function (j) {
    var l;
    var m = j;
    var i;
    var n = function (b) {
      var d = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
      var e = {'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};
      d.lastIndex = 0;
      return d.test(b) ? '"' + b.replace(d, function (a) {
        var c = e[a];
        return typeof c === 'string' ? c : '\\u' + ('0000'+a.charCodeAt(0).toString(16)).slice(-4)
      }) + '"' : '"' + b + '"'
    };
    
    var o = function(a,b) {
      var c = '';
      var d = '    ';
      var i = 0;
      var k = '';
      var v='';
      var e=0;
      var f=c;
      var g=[];
      var h=b[a];
      
      if (h && typeof h==='object' && typeof h.toJSON === 'function') {
        h = h.toJSON(a)
      }
      
      switch (typeof h) {
        case 'string':
          return n(h);

        case 'number':
          return isFinite(h) ? String(h) : 'null';

        case 'boolean':
        case 'null':
          return String(h);

        case 'object':
          if (!h) {
            return 'null'
          }
          
          c += d;
          g = [];
          if (Object.prototype.toString.apply(h)==='[object Array]') {
            e = h.length;
            for (i=0;i<e;i+=1) {
              g[i]=o(i,h) || 'null'
            }
            v = g.length === 0 ? '[]' : c ? '[\n'+c+g.join(',\n'+c)+'\n'+f+']' : '['+g.join(',')+']';
            c = f;
            
            return v
          }
          
          for(k in h) {
            if(Object.hasOwnProperty.call(h,k)) {
              v=o(k,h);
              if(v){
                g.push(n(k)+(c?': ':':')+v)
              }
            }
          }
          
          v = g.length === 0 ? '{}' : c ? '{' + g.join(',') + '' + f + '}' : '{' + g.join(',') + '}' ;
          c=f;
          return v
      }
    };
      
    return o('', {'' :m });
  };

  api.base64_encode=function(a){var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";var c,o2,o3,h1,h2,h3,h4,bits,i=0,ac=0,enc="",tmp_arr=[];if(!a){return a}a=api.utf8_encode(a+'');do{c=a.charCodeAt(i++);o2=a.charCodeAt(i++);o3=a.charCodeAt(i++);bits=c<<16|o2<<8|o3;h1=bits>>18&0x3f;h2=bits>>12&0x3f;h3=bits>>6&0x3f;h4=bits&0x3f;tmp_arr[ac++]=b.charAt(h1)+b.charAt(h2)+b.charAt(h3)+b.charAt(h4)}while(i<a.length);enc=tmp_arr.join('');switch(a.length%3){case 1:enc=enc.slice(0,-2)+'==';break;case 2:enc=enc.slice(0,-1)+'=';break}return enc};
  
  api.utf8_encode=function(a){a=(a+'').replace(/\r\n/g,"\n").replace(/\r/g,"\n");var b="";var c,end;var d=0;c=end=0;d=a.length;for(var n=0;n<d;n++){var e=a.charCodeAt(n);var f=null;if(e<128){end++}else if((e>127)&&(e<2048)){f=String.fromCharCode((e>>6)|192)+String.fromCharCode((e&63)|128)}else{f=String.fromCharCode((e>>12)|224)+String.fromCharCode(((e>>6)&63)|128)+String.fromCharCode((e&63)|128)}if(f!==null){if(end>c){b+=a.substring(c,end)}b+=f;c=end=n+1}}if(end>c){b+=a.substring(c,a.length)}return b};
  
  api.set_cookie=function(a,b,c,d){var e=new Date(),domain=((d)?api.parse_domain(document.location.hostname):""),cookiestring=a+"="+escape(b);e.setDate(e.getDate()+c);cookiestring+=((c===null)?"":";expires="+e.toGMTString());cookiestring+="; path=/";cookiestring+=((domain)?";domain=."+domain:"");document.cookie=cookiestring};api.get_cookie=function(a){if(document.cookie.length>0){var b=document.cookie.indexOf(a+"=");if(b!=-1){b=b+a.length+1;var c=document.cookie.indexOf(";",b);if(c==-1){c=document.cookie.length}return unescape(document.cookie.substring(b,c))}}return""};
  
  api.delete_cookie=function(a,b){api.set_cookie(a,'',-1,b)};
  
  api.parse_domain=function(a){var b=a.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i);return b?b[0]:''};
  
  api.get_super = function () {
    var a = eval('(' + api.get_cookie(api.config.cookie_name) + ')');
    if (a) {
      for (var i in a) {
        if (a.hasOwnProperty(i)) {
          api.super_properties[i] = a[i]
        }
      }
    }
    
    return api.super_properties
  };
  
  api.load_super_once = function () {
    if (!super_props_loaded) {
      try {
        api.get_super();
        super_props_loaded=true
      } catch(err){}
    }
  };
  
  api.register_funnel=function(a,b){api.funnels[a]=b};
  
  api.track_predefined_funnels=function(a,b){if(a&&api.funnels){for(var c in api.funnels){if(api.funnels.hasOwnProperty(c)){for(var i=0;i<api.funnels[c].length;++i){if(api.funnels[c][i]){if(api.funnels[c][i]==a){api.track_funnel(c,i+1,a,b)}}}}}}};
  
  api.save_campaign_params=function(){api.campaign_params_saved=api.campaign_params_saved||false;if(api.config.store_google&&!api.campaign_params_saved){var a=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'],kw='',params={};for(var b=0;b<a.length;b++){kw=api.get_query_param(document.URL,a[b]);if(kw.length){params[a[b]]=kw}}api.register_once(params);api.campaign_params_saved=true}};
  
  api.clear_old_cookie=function () {
    api.delete_cookie(api.config.cookie_name,false);
    api.set_cookie(api.config.cookie_name,api.json_encode(api.super_properties),7,true)
  };
  
  api.set_config=function(a){for(var c in a){if(a.hasOwnProperty(c)){api.config[c]=a[c]}}};
  
  var t= (("https:"==document.location.protocol)?"https://":"http://");

  api.token = q;
  api.api_host = t + 'api.mixpanel.com';
  
  if (r) {
    api.callback_fn = r + '.jsonp_callback'
  } else {
    api.callback_fn = 'mpmetrics.jsonp_callback'
  }

  return s
};

if (typeof mpq!='undefined' && mpq && mpq[0] && mpq[0][0] == 'init') {
  mpq.metrics = new MixpanelLib(mpq[0][1], "mpq.metrics");
  mpq.push = function(a) {
    if (a) {
      if (typeof a == 'function') {
        a()
      } else if (a.constructor == Array) {
        var f = mpq.metrics[a[0]];
        if (typeof f=='function') {
          f.apply(mpq.metrics,a.slice(1))
        }
      }
    }
  };
  
  for (var i=1;i<mpq.length;i++) {
    mpq.push(mpq[i])
  }
  
  mpq.length=0
}
