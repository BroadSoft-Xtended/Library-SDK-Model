var utils = require('bdsft-sdk-utils')
var core = require('bdsft-sdk-core')

module.exports = Model;

function Model(constructor, options) {
	var self = {};

	self.create = function(constructorArgs, createOptions) {
		constructorArgs = constructorArgs || [];
		createOptions = createOptions || {};
		options = options || {};
		var object = utils.createFun(constructor, constructorArgs);
		object._name = self.name;
		object.create = object.create || function(name, args, opts) {
			return Factory(createOptions)(name, self, name, args, opts);
		};
		object.parse = object.parse || function(value){
			var obj = typeof value === 'string' ? JSON.parse(value) : value;
			for(var key in obj) {
				var val = obj[key];
				object[key] = val;
			}
			return object;
		};
		object.toJSON = object.toJSON || function(){
			var obj = {};
			var keys;
			if(Array.isArray(object.props)){
				keys = object.props;
			} else {
				keys = Object.keys(object.props);
			}
			for(var i=0; i < keys.length; i++){
				var prop = keys[i];
				obj[prop] = object[prop];
			}
			return obj
		};
		object.toString = function(){
			return JSON.stringify(object.toJSON());
		};
		object.databinder = core.databinder(self.name);
		var medias = utils.extend({},
			options.media,
			options.media && options.media['media'],
			options.media && options.media[self.name],
			createOptions.media && createOptions.media[self.name]
		);
		if (Object.keys(medias).length) {
			object.medias = medias;
		}
		var createConfig = createOptions.config && createOptions.config[self.name] || createOptions[self.name];
		var config = options.config && options.config[self.name] || options.config;
		if (config || createConfig) {
			var config = utils.extend({}, config, createConfig);
			for (var name in config) {
				core.prop(object, {
					name: name,
					value: config[name]
				}, object.databinder);
			}
			object.updateConfig = object.updateConfig || function(config) {
				config = config || {};
				for (var name in config) {
					if (typeof object[name] !== 'undefined') {
						object[name] = config[name];
					}
				}
			};
			object.configChanges = object.configChanges || function() {
				var changes = {};
				for (var name in config) {
					if (JSON.stringify(object[name]) !== JSON.stringify(config[name])) {
						changes[name] = object[name];
					}
				}
				return changes;
			};
		}
		object._addProps = function(props){
			(Array.isArray(props) && props || props && Object.keys(props) || []).forEach(function(name) {
				var value = props[name];
				object._addProp(name, value, props._type);
			});
		};
		object._addProp = function(name, value, type){
			var prop = utils.extend({
				name: name
			}, (Array.isArray(value) || typeof value !== 'object') && {
				value: value
			} || value)
			var type = prop.type || object._propstype || type || '';
			if (type === 'default') {
				type = '';
			}
			if (name === 'visible') {
				type = 'visible';
			}
			require('./app')[type + 'prop'](object, prop, object.databinder);
		};
		object._addProps(object.props);
		core.call(object, 'listeners', options, constructorArgs);
		core.call(object, 'init', options, constructorArgs);
		core.bindings(object, constructorArgs);
		return object;
	};

	self.argNames = utils.argNamesFun(constructor);
	self.name = utils.functionName(constructor);
	self.options = options;
	self.constructor = constructor;

	return self;
};