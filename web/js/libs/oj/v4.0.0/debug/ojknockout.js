/**
 * Copyright (c) 2014, 2017, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
"use strict";
define(['ojs/ojcore', 'jquery', 'knockout', 'jqueryui-amd/widget', 'ojs/ojkoshared'], function(oj, $, ko)
{
/**
 * @private
 * @constructor
 * Global Change Queue Implementation
 * The queue is used to delay component updates until all model changes have been propagated
 * This is a private class that does not need to be xported
 */
function GlobalChangeQueue()
{
  this.Init();
}

// Subclass from oj.Object 
oj.Object.createSubclass(GlobalChangeQueue, oj.Object, "ComponentBinding.GlobalChangeQueue");

GlobalChangeQueue.prototype.Init = function()
{
  GlobalChangeQueue.superclass.Init.call(this);
  this._trackers = [];
  this._queue = [];
};

GlobalChangeQueue.prototype.registerComponentChanges = function(tracker)
{
  if (this._trackers.indexOf(tracker) === -1)
  {
    this._trackers.push(tracker);
    if (!this._delayTimer)
    {
      this._delayTimer = setTimeout(oj.Object.createCallback(this, this._deliverChangesImpl), 1);//@HTMLUpdateOK; delayting our own callback
    }
  }
};


GlobalChangeQueue.prototype.deliverChanges = function()
{
  if (this._delayTimer)
  {
    clearTimeout(this._delayTimer);
  }
  this._deliverChangesImpl();
};

GlobalChangeQueue.prototype._deliverChangesImpl = function()
{
  var i;
  this._delayTimer = null;
  var trackers = this._trackers;
  this._trackers = [];
  
 
  for (i=0; i<trackers.length; i++)
  {
    var tracker = trackers[i];
    this._queue.push({tracker: tracker, changes: tracker.flushChanges()});
  }
  
  while (this._queue.length > 0)
  {
    var record = this._queue.shift();
    record.tracker.applyChanges(record.changes);
  }
};
/*jslint browser: true, devel: true*/
/*global ComponentChangeTracker:true*/


/**
 * To create a custom binding,
 * use oj.ComponentBinding.create(). Using prototypal inheritance to extend
 * oj.ComponentBinding is not supported.
 * @export
 * @class oj.ComponentBinding 
 * @classdesc JQueryUI component binding for Knockout.js. 
 * @param {string|Array.<string>} name - the name of the binding or an
 * array of strings in case the binding needs to be registered under several names
 * @param {?(Object|string)=} options - property object
 * @see oj.ComponentBinding.create
 * @constructor
 */
oj.ComponentBinding = function(name, options)
{
  this.Init(name, options);
};

oj.Object.createSubclass(oj.ComponentBinding, oj.Object, "oj.ComponentBinding");


/**
 * Creates a binding instance and registers it with Knockout.js
 * @export
 * @param {string|Array.<string>} name - the name of the binding or an
 * array of strings in case the binding needs to be registered under several names
 * @param {?(Object|string)=} options - property object with the following fields:
 * <ul>
 *   <li>{string} 'componentName' - name of the component 
 *       Not specifying this parameter indicates that the binding should use the 'component' attribute 
 *       on itself to determine the constructor name
 *   </li>
 *   <li>{Function} 'afterCreate'- a callback invoked after the component instance has been created.
 *        The function will receive the following parameters:
 *        <ul>
 *           <li>{Element} element - DOM element associated with this binding</li>
 *           <li>{Function} widgetConstructor - constructor for the JQueryUI widget created
 *            by this binding. The constructor is already bound to the associated 
 *            JQuery element</li>
 *           <li>{Function} valueAccessor - a JavaScript function that you can call to 
 *           get a map of current binding attributes</li>
 *           <li>{Object} allBindings -  a JavaScript object that you can use to access all the model values bound 
 *           to this DOM element</li>
 *           <li>{Object} bindingContext -  an object that holds the binding context available to this element's bindings. 
 *           This object includes special properties including $parent, $parents, and $root that can be used to access
 *           data that is bound against ancestors of this context</li>
 *        </ul>
 *   </li>
 *   <li>{Function} 'beforeDestroy'- a callback invoked before the component instance is detroyed
 *        The function will receive the same parameters as the 'afterCreate' callback above.
 *   </li>
 * </ul>
 * When this parameter is specified as a string, it will be interpreted as a single 'componentName' option
 * @return {oj.ComponentBinding} binding instance
 */
oj.ComponentBinding.create = function(name, options)
{
  if (name == null)
  {
    throw "Binding name is required!";
  }
  
  var instance = new oj.ComponentBinding(name, options);
  
  var componentName = instance._getBindingOptions()['componentName'];
  
  var handlers = ko.bindingHandlers, i;
  var names = Array.isArray(name) ? name : [name];
  for (i=0; i<names.length; i++)
  {
    var nm = names[i];
    oj.ComponentBinding._REGISTERED_NAMES.push(nm);
    
    handlers[nm] = instance;
  }
  
  return instance;
};

/**
 * Retrieves the default component binding instance registered with Knockout.js
 * @return {oj.ComponentBinding} default binding instance
 * @export
 */
oj.ComponentBinding.getDefaultInstance = function()
{
  return oj.ComponentBinding._INSTANCE;
};

/**
 * Sets up custom handling for attributes that will be managed by this binding 
 * instance
 * @param {Object} opts - property object with the following fields:
 * <ul>
 *   <li>'attributes' - string array of attribue names</li>
 *   <li>{Function} 'init' - a function called when a managed attribute is initialized.
 *        The function will receive the following parameters:
 *        <ul>
 *           <li>{string} name - attribute name</li>
 *           <li>{Object} value - attribute value</li>
 *           <li>{Element} element - DOM element where this binding is being attached</li>
 *           <li>{Function} widgetConstructor - constructor for the JQueryUI widget created
 *            by this binding. The constructor is already bound to the associated 
 *            JQuery element</li>
 *           <li>{Function} valueAccessor - a JavaScript function that you can call to 
 *           get a map of current binding attributes</li>
 *           <li>{Object} allBindings -  a JavaScript object that you can use to access all the model values bound 
 *           to this DOM element</li>
 *           <li>{Object} bindingContext -  an object that holds the binding context available to this element's bindings. 
 *           This object includes special properties including $parent, $parents, and $root that can be used to access
 *           data that is bound against ancestors of this context</li>
 *        </ul>
 *        The optional return value of the function is a name-to-value map of
 *        properties that should be set on the component
 *   </li>
 *   <li>{Function} 'update' - a function called when a managed attribute is updated.
 *        The function will receive the same parameters as the 'init' callback above.
 *        The optional return value of the function is a name-to-value map of
 *        properties that should be set on the component at the time when other
 *        accumulated changes are delivered
 *   </li>
 *   <li>{Function} 'afterCreate'- a callback invoked after the component instance has been created.
 *        The function will receive the following parameters:
 *        <ul>
 *           <li>{string} name - attribute name</li>
 *           <li>{Element} element - DOM element associated with this binding</li>
 *           <li>{Function} widgetConstructor - constructor for the JQueryUI widget created
 *            by this binding. The constructor is already bound to the associated 
 *            JQuery element</li>
 *           <li>{Function} valueAccessor - a JavaScript function that you can call to 
 *           get a map of current binding attributes</li>
 *           <li>{Object} allBindings -  a JavaScript object that you can use to access all the model values bound 
 *           to this DOM element</li>
 *           <li>{Object} bindingContext -  an object that holds the binding context available to this element's bindings. 
 *           This object includes special properties including $parent, $parents, and $root that can be used to access
 *           data that is bound against ancestors of this context</li>
 *        </ul>
 *   </li>
 *   <li>{string} 'for' (optional) - a string representing component type or constructor 
 *        name restricting the applicability of these managed attributes
 *   </li>
 *   <li>{Array.<string>} 'use' (optional) - an string array of component types whose managed attribute behavior
 *       should be used for the component type specified with the 'for' attribute
 *   </li>
 *   <li>{Function} 'beforeDestroy'- a callback invoked before the component instance is detroyed
 *        The function will receive the same parameters as the 'afterCreate' callback above.
 *   </li>
 * </ul>
 * @export
 */
oj.ComponentBinding.prototype.setupManagedAttributes = function(opts)
{
  var forName = opts['for'];
  forName = forName == null ? '@global' : forName;
  
  var managers = this._managedAttrOptions[forName] || [];
  
  managers.push(opts);
  
  this._managedAttrOptions[forName] = managers;
};



/**
 * Delivers all accumulated component changes across all instances of this binding.
 * Calling this method is optional - the changes will be delivered after a 1ms timeout
 * if this method is never invoked. However, you may call this method to speed up
 * component updates when the aplication code is done updating the view models.
 * @export
 */
oj.ComponentBinding.deliverChanges = function()
{
  oj.ComponentBinding._changeQueue.deliverChanges();
};

/**
 * @private
 */
oj.ComponentBinding.prototype.Init = function(names, options)
{
  oj.ComponentBinding.superclass.Init.call(this);
  
  if (typeof options === "string")
  {
    options = {'componentName': options};
  }
  
  this._bindingOptions = options || {};
  
  
  this._bindingNames = Array.isArray(names) ? names : [names];
  
  this['init'] = this._init.bind(this);
  this['update'] = this._update.bind(this);
  
  this._managedAttrOptions = {};
};

/**
 * @private
 */
oj.ComponentBinding.prototype._getBindingOptions = function()
{
  return this._bindingOptions
}



/**
 * @private
 */
oj.ComponentBinding.prototype._init = function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) 
{
  //Invoke child bindings first to allow on-the-fly generation of child content
  ko.applyBindingsToDescendants(bindingContext, element);
  
    
  return {'controlsDescendantBindings': true};
};


/**
 * @private
 */
oj.ComponentBinding.prototype._update = function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
{
  // an array of ko.computed() that would need cleaning up
  var componentComputeds = [];
  var stage = 0; //init
  var component;
  var changeTracker;
  
  var jelem = $(element);
  
  function cleanup(destroyComponent)
  {
    componentComputeds.forEach(function(computed){ computed['dispose'](); });
    componentComputeds = [];
    
    // when cleanup() is called by the node disposal, there is no need to destroy the component because cleanNode() will
    // do it for us
    if (destroyComponent && component)
    {
      component('destroy');
      component = null;
    }
    if (changeTracker)
    {
      changeTracker.dispose();
      changeTracker = null;
    }
    
    jelem.off(oj.ComponentBinding._HANDLER_NAMESPACE);
  };
  
  function createComponent(componentName, nameOption, bindingValue)
  { 
    if (componentName == null)
    {
      // null component name is legal - we just won't create a components
      return;
    }
  
    var comp = jelem[componentName];
    
    if ((typeof comp) !== "function")
    {
      oj.Logger.error("Component %s is not found", componentName);
      return;
    }
    
    comp = comp.bind(jelem);
    
    var updaterCallback = function(changes) 
    {
      var mutationOptions = oj.ComponentBinding.__removeDotNotationOptions(changes);
    
      comp("option", changes);
      var keys  = Object.keys(mutationOptions);
      
      for (var k=0; k<keys.length; k++)
      {
        var key = keys[k];
        comp("option", key, mutationOptions[key]);
      }
    };
    
    changeTracker = new ComponentChangeTracker(updaterCallback, oj.ComponentBinding._changeQueue);
    
    // Create a compatible valueAccessor for backward compatibility with the managed attributes and custom bindings that
    // expect the ojComponent value to be defined inline. We can use already-resolved binding value here because the component
    // will be recreated whenever the binding value changes, and this method will be called with the new binding value
    
    var compatibleValueAccessor = function(){return bindingValue;};
                                        
    var specifiedOptions = Object.keys(bindingValue).filter(
        function(value)
        {
          return !(value == null || value === nameOption);
        }
    );
    
    
    var componentContext = 
    {
      component: comp,
      changeTracker: changeTracker,
      componentName: componentName,
      specifiedOptions: specifiedOptions,
      computeds: componentComputeds, 
      valueAccessor: compatibleValueAccessor, 
      allBindingsAccessor: allBindingsAccessor, 
      bindingContext: bindingContext,
      destroyCallback: function(){component = null;},
      readOnlyProperties: {}
    };
    
    component = this._initComponent(element, componentContext);
  }
  
  // Since we want the update() method to be invoked by Knockout only once, we are suspending dependency detection
  ko.ignoreDependencies(
    function()
    {
      ko.computed(
        function()
        {
          // invoking valueAccessor() adds a dependency on the bidning value and the possible observable ViewModel
          // to this computed, and unwrapping the observable adds a dependency on the observable binding value
          var bindingValue = ko.utils.unwrapObservable(valueAccessor());
          
          if (typeof bindingValue !== 'object')
          {
            oj.Logger.error("ojComponent binding should evaluate to an object");                
          }
          
          var componentName = this._bindingOptions['componentName'];
          
          var nameOpt;
          var nameOptionFound = false;
          
          if (componentName == null & bindingValue != null)
          {
            var name_attrs = [oj.ComponentBinding._COMPONENT_OPTION, 'role'];
            
            for(var n=0; !nameOptionFound && n<name_attrs.length; n++)
            {
              nameOpt = name_attrs[n];
              if (nameOpt in bindingValue)
              {
                nameOptionFound = true;
                componentName = bindingValue[nameOpt];
              }
            }
            
            if (!nameOptionFound)
            {
              oj.Logger.error("component attribute is required for the ojComponent binding");
            }
            
            componentName = ko.utils.unwrapObservable(componentName);  
          }
          
          
          if (stage == 0)
          {
            stage = 1;
          }
          else
          {
            // Suspend dependency detection for this computed during cleanup()
            ko.ignoreDependencies(cleanup, this, [true]);
          }
          
          // Suspend dependency detection for this computed during createComponent(). Changes to the component options
          // will be tracked separately
          ko.ignoreDependencies(createComponent, this, [componentName, nameOpt, bindingValue]);
        },
        this,
        {'disposeWhenNodeIsRemoved' : element}
      );
    },
    this
  );
    
  // cleanup() called by the node disposal should not be destroying components, as they will be destroyed by .cleanNode()
  ko.utils.domNodeDisposal.addDisposeCallback(element, cleanup.bind(this, false /*detsroyComponent flag*/));
};


/**
 * @private
 */
oj.ComponentBinding.prototype._initComponent = function(element, ctx)
{
  var disposed = false;
  var stage = 0; //init
  
  var specifiedManagedAttrs = {};
  
  var jelem = $(element);
  
  var comp = ctx.component;
  var componentName = ctx.componentName;
  
  var self = this;
  
  var destroyEventType = "_ojDestroy";

      
  var destroyListener = 
    function(evt)
    {
      if (evt.target && evt.target == element)
      {
        // ensure that we do not try to destroy the component again during node cleanup
        ctx.destroyCallback();
        
        var destroyCallback = self._bindingOptions['beforeDestroy'];
        if (destroyCallback)
        {
          destroyCallback(element, comp, ctx.valueAccessor, ctx.allBindingsAccessor, ctx.bindingContext);
        }
        
        oj.ComponentBinding._deliverCreateDestroyEventToManagedProps(false, 
                      specifiedManagedAttrs, element, comp, ctx.valueAccessor, 
                      ctx.allBindingsAccessor, ctx.bindingContext);
        
        disposed = true;
        ctx.changeTracker.dispose();
        element.removeEventListener(destroyEventType, destroyListener);
      }
    };
  
  element.addEventListener(destroyEventType, destroyListener);
      
  var managedAttrMap = oj.ComponentBinding._resolveManagedAttributes(this._managedAttrOptions, ctx.specifiedOptions, componentName);
      
  // Always use managed attribute behavior from the default instance
  var defaultInstance = oj.ComponentBinding.getDefaultInstance();
  if (this !== defaultInstance)
  {
    var defaultManagedMap = defaultInstance._getManagedAttributes(ctx.specifiedOptions, componentName);
    // Override default managed attribute map with values from this binding's map.
    // Note that there is no need to clone defaultManagedMap because a new instance gets created
    // every time _getManagedAttributes() is called
    oj.CollectionUtils.copyInto(defaultManagedMap, managedAttrMap);
    managedAttrMap = defaultManagedMap;
  }
      
  var resolvedInitialOptions = {};
      
  var propertyReadFunc = function()
  {
    var prop = this._property;
   
    var value = oj.ComponentBinding._toJS(ctx.valueAccessor()[prop]);

    
    if (stage === 0) // init, no change
    {
      var managedPropEntry = managedAttrMap[prop];
      if (managedPropEntry != null)
      {
        specifiedManagedAttrs[prop] = managedPropEntry;
        var initFunc = managedPropEntry.init;
        if (initFunc != null)
        {
          var initProps = initFunc(prop, value, element, comp, ctx.valueAccessor, 
                                   ctx.allBindingsAccessor, ctx.bindingContext) || {};
          oj.CollectionUtils.copyInto(resolvedInitialOptions, initProps);
        }
      }
      else
      {
        resolvedInitialOptions[prop] = value;
      }
    }
    // this is a post-init change
    else if (!disposed)
    { 
      if (managedAttrMap[prop] != null)
      {
        var updateFunc = managedAttrMap[prop].update;
        if (updateFunc != null) 
        {
          var updateProps = updateFunc(prop, value, element, comp, ctx.valueAccessor, 
                                        ctx.allBindingsAccessor, ctx.bindingContext) || {};
          
          var updateKeys = Object.keys(updateProps);
          
          for (var k = 0; k<updateKeys.length; k++)            
          {
            var p = updateKeys[k];
            ctx.changeTracker.addChange(p, oj.ComponentBinding.__cloneIfArray(updateProps[p]));
          }
        }
      }
      else if (!ctx.readOnlyProperties[prop]) // ignore chnages to read-only properties
      {
        ctx.changeTracker.addChange(prop, oj.ComponentBinding.__cloneIfArray(value));
      }
    }
  };
      
     
  for (var k=0; k < ctx.specifiedOptions.length; k++)
  {   
    // ko.computed is used to set up dependency tracking for the bindings's attribute
    // Any observable evaulated during the initial invocation of the function is going to be treated as a dependency
    // by Knockout. Once that dependency changes, the fuction below will be called again, in which case we will know
    // to deliver the change
    ctx.computeds.push(
        ko.computed(propertyReadFunc, 
                    {_property: ctx.specifiedOptions[k]}/* 'this' object for the 'read' function*/
                   )
    );
  }
  
  stage = 1; // post-init
  
      
  oj.ComponentBinding._registerWritebacks(jelem, ctx);
      
  var mutationOptions = oj.ComponentBinding.__removeDotNotationOptions(resolvedInitialOptions);
  
  // Initialization of the component happens here
  comp(resolvedInitialOptions);
  
  Object.keys(mutationOptions).forEach(
    function(mo)
    {
      comp('option', mo, mutationOptions[mo]);
    }
  );
  
  var createCallback = this._bindingOptions['afterCreate'];
  if (createCallback)
  {
    createCallback(element, comp, ctx.valueAccessor, ctx.allBindingsAccessor, ctx.bindingContext);
  }
  
  oj.ComponentBinding._deliverCreateDestroyEventToManagedProps(true, specifiedManagedAttrs, 
              element, comp, ctx.valueAccessor, ctx.allBindingsAccessor, ctx.bindingContext);
  
  
  resolvedInitialOptions = null;
  
  return comp;
};



/**
 * @ignore
 */
oj.ComponentBinding.__CreateEvaluator = function(expr)
{
  /*jslint evil:true */
  return new Function("$context", "with($context){with($data||{}){return " + expr + ";}}"); //@HTMLUpdateOK; binding expression evaluation
}

/**
 * @private 
 */
function _extractValueFromChangeEvent(event, eventData) 
{
  var prop = 'value';
  var nameVal = {};
  nameVal[prop] = eventData[prop];
  return nameVal;
};

/**
 * @private 
 */
function _extractOptionChange(ctx, event, eventData)
{
  var nameVal = {};
  var metadata = eventData['optionMetadata'];
  if (metadata)
  {
    var shouldWrite = ("shouldWrite" === metadata['writeback']);
    if (shouldWrite)
    {
      var name = eventData['option'];
      nameVal[name] = eventData['value'];
      if (metadata['readOnly'])
      {
        ctx.readOnlyProperties[name] = true;
      }
    }
  }
  return nameVal;
};

/**
 * @private
 */
oj.ComponentBinding.prototype._getManagedAttributes = function(specifiedOptions, componentName)
{
  return oj.ComponentBinding._resolveManagedAttributes(this._managedAttrOptions, specifiedOptions, componentName);
}

/**
 * @private
 */
oj.ComponentBinding._resolveManagedAttributes = function(optionMap, specifiedOptions, componentName)
{
  var managedAttrMap = {};
  
  var applicableOptions = [];
  
  var attrs_field = 'attributes';
  
  var traverseOptions = function(name, followLinks)
  {
    var managers = optionMap[name];
    if (managers != null)
    {
      for (var n=managers.length-1; n>=0; n--)
      {
        var opt = managers[n];
        
        if (opt[attrs_field] != null)
        {
          applicableOptions.push(opt);
        }
        if (followLinks)
        {
          var parents = opt['use'];
          if (parents != null)
          {
            parents = Array.isArray(parents) ? parents : [parents];
            for (var i=0; i<parents.length; i++)
            {
              traverseOptions(parents[i], true);
            }
          }
        }
      }
    }
  };
  
  traverseOptions(componentName, true);
  
  // If this is a JET component, check managed options registered for the ancestors
  var ojNamespace = 'oj';
  var widgetClass = $[ojNamespace][componentName];
  
  if (widgetClass != null)
  {
    var proto = Object.getPrototypeOf(widgetClass.prototype);
    while (proto != null && ojNamespace === proto['namespace'])
    {
      traverseOptions(proto['widgetName'], true)
      proto = Object.getPrototypeOf(proto);
    }
  }
  
  traverseOptions('@global', false);
  
  if (applicableOptions.length > 0)
  { 
    for (var k=0; k<specifiedOptions.length; k++)
    {
      var attr = specifiedOptions[k];
   
      for (var l=0; l<applicableOptions.length; l++)
      {
        var opts  = applicableOptions[l];
        
        var attributes = opts[attrs_field];
        
        if (attributes.indexOf(attr) >= 0)
        {
          managedAttrMap[attr] = {init: opts['init'], update:opts['update'], 
                                  afterCreate:opts['afterCreate'], beforeDestroy:opts['beforeDestroy']};
          break;
        }
      }
    }
  }
  
  return managedAttrMap;
};

/**
 * @private
 */
oj.ComponentBinding._HANDLER_NAMESPACE = ".oj_ko";


/**
 * @private
 */
oj.ComponentBinding._registerWritebacks = function(jelem, ctx)
{
  var writablePropMap = 
  {
    '^slider$' : [{'event': 'slidechange', 'getter': _extractValueFromChangeEvent}],
    '^oj*': [{'event': 'ojoptionchange', 'getter': _extractOptionChange.bind(undefined, ctx)}]
  };
  
  var cachedWriterFunctionEvaluators = {};
  
  var keys = Object.keys(writablePropMap);
  
  for (var k=0; k < keys.length; k++)
  {
    var pattern = keys[k];
    if (ctx.componentName.match(pattern))
    {
      var eventInfos = writablePropMap[pattern];
      for (var i=0; i<eventInfos.length; i++)
      {
        var info = eventInfos[i];
        
        jelem.on(
          info['event'] + oj.ComponentBinding._HANDLER_NAMESPACE,
          { //JQuery will pass this object as event.data
            getter: info['getter']
          },
          function(evt, data)
          {
            // Ignore optionChange events that bubbled up from child components
            if(evt.target !== jelem[0])
            {
              return;
            }
            
            var nameValues = evt.data.getter(evt, data);       
           
            var accessor = ctx.valueAccessor();
            
            var names = Object.keys(nameValues);
            for (var nm=0; nm<names.length; nm++)
            {
              var name = names[nm];
              ctx.changeTracker.suspend(name);
              try
              {
                if (ctx.specifiedOptions.indexOf(name) >= 0)
                {
                  
                  var optionMap = accessor[oj.ComponentBinding._OPTION_MAP];
                  var expr = optionMap == null ? null: optionMap[name];
                
                  var target = accessor[name];
                  
                  oj.ComponentBinding._writeValueToProperty(name, 
                                                            target, 
                                                            nameValues[name],
                                                            expr,
                                                            ctx.bindingContext,
                                                            cachedWriterFunctionEvaluators);
                }
              }
              finally
              {
                ctx.changeTracker.resume(name);
              }  
            }
            
          }
        );
      }
      break;
    }
  }
      
};



/**
 * @private
 */
oj.ComponentBinding._writeValueToProperty = function(name, target, value,
                                                     propertyExpression,
                                                     bindingContext, 
                                                     cachedWriterFunctionEvaluators)
{  
  if (target == null || !ko.isObservable(target))
  {    
    if (!(name in cachedWriterFunctionEvaluators))
    {
      var inContextWriter = null;
      var writerExpr = oj.__ExpressionUtils.getPropertyWriterExpression(propertyExpression);
      if (writerExpr != null)
      {
        inContextWriter = oj.ComponentBinding.__CreateEvaluator(writerExpr);
      }
      cachedWriterFunctionEvaluators[name] = inContextWriter;
    }
    
    var func = cachedWriterFunctionEvaluators[name];
    
    if (func)
    {
      var writer = func(bindingContext);
      writer(oj.ComponentBinding.__cloneIfArray(value));
    }
  
  }
  else if (ko.isWriteableObservable(target))
  {
    target(oj.ComponentBinding.__cloneIfArray(value));
  }
};


/**
 * @private
 */
oj.ComponentBinding._toJS = function(prop) 
{
  // ko.toJS creates a cloned object for both plain javascript objects and Object subclasses. We need to avoid it
  // for the latter case to ensure that complex Model objects can be used as binding properties without being cloned
  
  prop = ko.utils.unwrapObservable(prop);
  
  if ((Array.isArray(prop) || oj.CollectionUtils.isPlainObject(prop)) && prop['ojConvertToJS'])
  {
    prop = ko.toJS(prop);
  }

  return prop;
};


/**
 * @ignore
 */
oj.ComponentBinding.__cloneIfArray = function(value)
{
  if (Array.isArray(value))
  {
    value = value.slice();
  }
  return value;
}



/**
 * @private
 */
oj.ComponentBinding.__removeDotNotationOptions = function(options)
{
  var mutationOptions = {};
  
  var keys = Object.keys(options);
  
  for (var k=0; k<keys.length; k++)
  {
    var opt = keys[k];
    if (opt.indexOf('.') >= 0)
    {
      mutationOptions[opt] = options[opt];
      delete options[opt];
    }
  }
  
  return mutationOptions;
};


/**
 * @private
 */
oj.ComponentBinding._deliverCreateDestroyEventToManagedProps = function(isCreate, 
                    managedAttrMap, element, comp, valueAccessor, allBindingsAccessor, bindingContext)
{
  var props = Object.keys(managedAttrMap);
  for (var i=0; i<props.length; i++)
  {
    var prop = props[i];
    var entry = managedAttrMap[prop];
    var callback = isCreate ? entry.afterCreate : entry.beforeDestroy;
    
    if (callback)
    {
      callback(prop, element, comp, valueAccessor, allBindingsAccessor, bindingContext);
    }
  }
  
};

/**
 * @private
 */
oj.ComponentBinding._changeQueue = new GlobalChangeQueue();

/**
 * @private
 */
oj.ComponentBinding.__getKnockoutVersion = function() {
    if (oj.__isAmdLoaderPresent() && ko) {
        return ko.version;
    };
    return "";
};

/**
 * @private
 */
oj.ComponentBinding._isNameRegistered = function(bindingName)
{
  return oj.ComponentBinding._REGISTERED_NAMES.indexOf(bindingName) >=0;
}




/**
 * @ignore
 */
oj.ComponentBinding._REGISTERED_NAMES = [];


/**
 * @ignore
 */
oj.ComponentBinding._COMPONENT_OPTION = 'component';

/**
 * @ignore
 */
oj.ComponentBinding._OPTION_MAP = '_ojOptions';



/**
 * Redefine ko.removeNode, so that JET components can implement custom _destroy() behavior when
 * the cmponent's nore is being removed (see ).
 * @private
 */
 (function()
 {
    var name = 'removeNode';
    var wrapped = ko[name];
    
    ko[name]  = function(node) 
    {
      // This module doe snot have an explicit dependency on ojcomponentcore,
      // so check for the oj.Components instance dynamically
      var ojComponents = oj.Components;
      if (ojComponents)
      {
        oj.DomUtils.setInKoRemoveNode(node);
      }
      try
      {
        wrapped(node);
      }
      finally
      {
        if (ojComponents)
        {
          oj.DomUtils.setInKoRemoveNode(null);
        }
      }
    };
 
 })();
 
 /**
 * @private
 */
oj.ComponentBinding._INSTANCE = oj.ComponentBinding.create(["ojComponent", "jqueryUI"]);


/**
 * This is added so that we could cleanup any ko references on the element when it is removed.
 * @export
 */
$.widget("oj._ojDetectCleanData", 
{
  options: 
  {
    /**
     * @type {boolean}
     * @default <code class="prettyprint">false</code>
     */
    'cleanParent': false,
  },
  _destroy: function()
  {
    var disposal, cleanExternalData, oldCleanExternal;

    disposal = ko.utils.domNodeDisposal;
    cleanExternalData = "cleanExternalData";

    // need to temporarily short circuit the domNodeDisposal call otherwise
    // the _destroy override would be invoked again 
    oldCleanExternal = disposal[cleanExternalData];
    disposal[cleanExternalData] = function(){};

    try
    {
      // provide the option to clean from the parent node for components like ojdatagrid so that the comment
      // and text nodes aren't memory leaked with ko when remove/_destroy is not called on all node types
      if (this.options['cleanParent'] && this.element[0].parentNode != null)
      {
        ko.cleanNode(this.element[0].parentNode);
      }
      else
      {
        ko.cleanNode(this.element[0]);          
      }
    }
    finally
    {
      disposal[cleanExternalData] = oldCleanExternal;
    }
  }
 }
);
/**
 * Common method to handle managed attributes for both init and update
 * @param {string} name the name of the attribute
 * @param {Object} value the value of the attribute
 * @param {Object} bindingContext the ko binding context
 * @return {Object} the modified attribute
 * @private
 */
function _handleManagedChartAttributes(name, value, bindingContext) {
  if (name === "pieCenter" && value['template']) {
    value['_renderer'] = _getDvtRenderer(bindingContext, value['template']);
  }
  return {'pieCenter': value};
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes({
  'attributes': ["pieCenter"],
  'init': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedChartAttributes(name, value, bindingContext);
  },
  'update': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedChartAttributes(name, value, bindingContext);
  },
  'for': 'ojChart'
});

/**
 * Returns a renderer function executes the template specified in the binding attribute.
 * (for example, a knockout template).
 * @param {Object} bindingContext the ko binding context
 * @param {string} template the name of the template
 * @return {Function} the renderer function
 * @private
 */
function _getComboboxOptionRenderer(bindingContext, template)
{
  return function(context)
  {
    var parent, childContext;
    parent = context["parentElement"];

    // runs the template
    childContext = bindingContext["createChildContext"](context["data"], null,
      function(binding)
      {
        binding["$optionContext"] = context;
      }
    );
    ko["renderTemplate"](template, childContext, null, parent);

    // tell the combobox not to do anything
    return null;
  };
}

/**
 * Common method to handle managed attributes for both init and update
 * @param {string} name the name of the attribute
 * @param {Object} value the value of the attribute
 * @param {Object} bindingContext the ko binding context
 * @return {Object} the modified attribute
 * @private
 */
function _handleComboboxManagedAttributes(name, value, bindingContext)
{
  if (name === "optionTemplate" && value !== null)
  {
    // find the option template and creates a renderer
    var template = String(value);
    var optionRenderer = _getComboboxOptionRenderer(bindingContext, template);

    return {"optionRenderer" : optionRenderer};
  }

  return null;
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
  {
    "attributes": ["optionTemplate"],
    "init": function(name, value, element, widgetConstructor, valueAccessor,
      allBindingsAccessor, bindingContext)
    {
      var result = _handleComboboxManagedAttributes(name, value, bindingContext);
      if (result !== null)
        return result;
    },
    "update": function(name, value, element, widgetConstructor, valueAccessor,
      allBindingsAccessor, bindingContext)
    {
      return _handleComboboxManagedAttributes(name, value, bindingContext);
    },
    "for": "ComboboxOptionRenderer"
  });

/**
 * Default declaration for ojCombobox
 */
oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
  {
    "for": "ojCombobox",
    "use": "ComboboxOptionRenderer"
  });

/**
 * Default declaration for ojSelect
 */
oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
  {
    "for": "ojSelect",
    "use": "ComboboxOptionRenderer"
  });

/**
 * Default declaration for ojInputSearch
 */
oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
  {
    "for": "ojInputSearch",
    "use": "ComboboxOptionRenderer"
  });

/**
 * @private
 * @constructor
 * Keeps track of changes for a single component
 */
function ComponentChangeTracker(component, queue)
{
  this.Init(component, queue);
}

// Subclass from oj.Object 
oj.Object.createSubclass(ComponentChangeTracker, oj.Object, "ComponentBinding.ComponentChangeTracker");

/**
 * @param {Function} updateCallback
 * @param {Object} queue
 */
ComponentChangeTracker.prototype.Init = function(updateCallback, queue)
{
  ComponentChangeTracker.superclass.Init.call(this);
  this._updateCallback = updateCallback;
  this._queue = queue;
  this._changes = {};
  this._suspendCountMap = {};
};


ComponentChangeTracker.prototype.addChange = function(property, value)
{
  if (this._isSuspended(property) || this._disposed)
  {
    return;
  }
  this._changes[property] = value;
  this._queue.registerComponentChanges(this);
};

ComponentChangeTracker.prototype.dispose = function()
{
  this._disposed = true;
};

ComponentChangeTracker.prototype.resume = function(option)
{
  var count = this._suspendCountMap[option] || 0;
  count--;
  if (count < 0)
  {
    oj.Logger.error("ComponentChangeTracker suspendCount underflow");
    return;
  }

  if (count == 0)
  {
    delete this._suspendCountMap[option];
  }
  else
  {
    this._suspendCountMap[option] = count;
  }
};

ComponentChangeTracker.prototype.suspend = function(option)
{
  var count = this._suspendCountMap[option] || 0;
  this._suspendCountMap[option] = count + 1;
};

ComponentChangeTracker.prototype.applyChanges = function(changes)
{
  if (!this._disposed)
  {
    this._updateCallback(changes);
  }
};

ComponentChangeTracker.prototype.flushChanges = function()
{
  var changes = this._changes;
  this._changes = {};
  return changes;
};


ComponentChangeTracker.prototype._isSuspended = function(option)
{
  var count = this._suspendCountMap[option] || 0;
  return (count >= 1);
};
/**
 * Copyright (c) 2014, Oracle and/or its affiliates.
 * All rights reserved.
 */

/*jslint browser: true, devel: true*/

// TODO: do we have JSDoc / API doc for bindings?  (Latest answer: no for now, just doc it briefly in baseComponent's contextMenu option for now.)
// TODO: split up init and update so get from DOM on init only, and update only sets it on DOM.  That way, 
//       can update observable to null, without having to additionally clear DOM attr to avoid having it restored from DOM attr.
//       Vet with Max first.
// TODO: keep binding and DOM in synch, a la disabled option in JQUI, similar to todo for contextMenu feature on JET base class.
// TODO: share code with baseComponent._SetupContextMenu?  Should this have any of the configurability of that method?
//       where would shared code live?
ko.bindingHandlers['ojContextMenu'] = 
{
  'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) 
  {
    // 1) declare vars including functions: ---

    var eventNamespace = ".ojContextMenu";
    var $element = $(element);
    
    var pressHoldTimer;
    var pressHoldThreshold = 750; // per UX spec.  Point of reference: JQ Mobile uses 750ms by default.
    var isPressHold = false; // to prevent pressHold from generating a click

    var touchInProgress = false;

    var doubleOpenTimer; // to prevent double open.  see usage below.
    var doubleOpenThreshold = 300; // made up this number.  TBD: Tweak as needed to make all platforms happy.
    var doubleOpenType = null; // "touchstart" or "contextmenu"
    
    // At least some of the time, the pressHold gesture also fires a click event same as a short tap.  Prevent that here.
    var clickListener = function( event ) {
        if (isPressHold) {
            // For Mobile Safari capture phase at least, returning false doesn't work; must use pD() and sP() explicitly.
            // Since it's wonky, do both for good measure.
            event.preventDefault();
            event.stopPropagation();
            isPressHold = false;
            return false;
        }
    };

    //, on Chrome preventDefault on "keyup" will avoid triggering contextmenu event 
    //which will display native contextmenu.This also need to be added on document as event target is not menu launcher.
    var preventKeyUpEventIfMenuOpen = function(event){
      if (event.which == 121 && event.shiftKey) // Shift-F10
      {
        if (getContextMenuNode().is(":visible"))
          event.preventDefault();
      }
    };

    // lazily get the Menu component in case it is inited after the ojContextMenu binding is applied to launcher.
    var getContextMenu = function()
    {
      var constructor = oj.Components.__GetWidgetConstructor(getContextMenuNode()[0], "ojMenu");

      // The JET Menu of the first element found.
      // Per architect discussion, get it every time rather than caching the menu.
      var contextMenu = constructor && constructor("instance");

      // if no element found, or if element has no JET Menu
      if (!contextMenu)
        throw new Error('ojContextMenu binding bound to "' + (menuId ? menuId : menuSelector) + '", which does not reference a valid JET Menu.');

      if (!contextMenuListenerSet) {
        // must use "on" syntax rather than clobbering whatever "close" handler the app may have set via the menu's "option" syntax
        contextMenu.widget().on( "ojclose" + eventNamespace , function( event, ui ) {
          document.removeEventListener("keyup", preventKeyUpEventIfMenuOpen);
        });

        contextMenuListenerSet = true;
      }

      return contextMenu;
    };
    
    // All gets of the menu element must use this function, rather than calling $(menuSelector) directly, 
    // in case menuId was provided instead.
    var getContextMenuNode = function()
    {
      return _getContextMenuNode(menuSelector, menuId);
    };

    var _getContextMenuNode = function(selector, id)
    {
      return (id)
        ? $(document.getElementById(id)) // Do NOT use $('#' + id), due to escaping issues
        : $(selector).first();
    };

    var launch = function(event, eventType, pressHold) {
        // ensure that pressHold doesn't result in a click.  Set this before the bailouts below.
        isPressHold = pressHold;

        var menu = getContextMenu();

        // In Mobile Safari only, mousedown fires *after* the touchend, which causes at least 2 problems:
        // 1) CM launches after 750ms (good), then disappears when lift finger (bad), because touchend --> 
        // mousedown, which calls Menu's "clikAway" mousedown listener, which dismisses Menu.  
        // 2) The isPressHold logic needs to reset the isPressHold ivar on any event that can start a click, 
        // including mousedown.  This problem causes the mousedown listener to incorrectly clear the ivar 
        // after a pressHold, which broke the whole mechanism.
        // SOLUTION FOR 1-2:  On each launch (at 750ms), set a one-time touchend listener that will set a 
        // var and clear it 50ms later.  While the var is set, both mousedown listeners can disregard the 
        // mousedown.  Make the var a static var in Menu, since Menu's listener is static, and since this 
        // launcher component can get/set it via an (effectively static) menu method.
        // NON-SOLUTIONS:  Cancelling touchstart or touchend, via pD() and sP(), doesn't cancel iPad's mousedown.  
        // Cancelling mousedown from here doesn't work even if capture phase, since ojMenu's listener is capture phase.
        // TIMING: The following block should be before the doubleOpen bailout.
        if (isPressHold)
        {
            $element.one( "touchend" + eventNamespace, function( event ) {
                var touchendMousedownThreshold = 50; // 50ms.  Make as small as possible to prevent unwanted side effects.
                menu.__contextMenuPressHoldJustEnded(true);
                setTimeout(function() { 
                    menu.__contextMenuPressHoldJustEnded(false);
                }, touchendMousedownThreshold); //@HTMLUpdateOK; delaying our own callback
            });
        }

        // On platforms like Android Chrome where long presses already fire the contextmenu event, the pressHold 
        // logic causes the menu to open twice, once for the pressHold, once for the contextmenu.  There's no 
        // guarantee which will happen first, but as long as they happen within doubleOpenThreshold ms 
        // of each other, this logic should prevent the double open.
        // Note: Another option is a platform-specific solution where we only use pressHold for platforms that need 
        // it (that don't already fire a contextmenu event for pressHold), but architectural preference is to avoid 
        // platform-specific solutions if possible.
        if ((doubleOpenType === "touchstart" && event.type === "contextmenu")
                || (doubleOpenType === "contextmenu" && event.type === "touchstart")) 
        {
            doubleOpenType = null;
            clearTimeout(doubleOpenTimer);
            return;
        }
        
        // if a nested element or component already showed a JET context menu for this event, don't replace it with ours.
        if (event.isDefaultPrevented()) 
          return;
        
        var position = {
          "mouse": {
            "my": "start top", 
            "at": "start bottom", 
            "of": event 
          }, 
          "touch": {
            "my": "start>40 center", 
            "at": "start bottom", 
            "of": event,
            "collision": "flipfit"
          }, 
          "keyboard": {
            "my": "start top", 
            "at": "start bottom", 
            "of": "launcher"
          }
        };

        var openOptions = {"launcher": $element, "initialFocus": "menu", "position": position[eventType]};

        menu.__openingContextMenu = true; // Hack.  See todo on this ivar in Menu.open().
        menu.open(event, openOptions);
        menu.__openingContextMenu = false;
        
        // if the launch wasn't cancelled by a beforeOpen listener
        if (menu.widget().is(":visible"))
        {  
          event.preventDefault(); // don't show native context menu
          document.addEventListener("keyup", preventKeyUpEventIfMenuOpen);
          
          // see double-open comments above
          if (event.type === "touchstart" || event.type === "contextmenu")
          {
            doubleOpenType = event.type;
            doubleOpenTimer = setTimeout(function(){ 
              doubleOpenType = null;
            }, doubleOpenThreshold); //@HTMLUpdateOK; delaying our own callback
          }
        }
    };


    // 2) Clean up from previously bound value, if any: ---
    
    $element
      .off( eventNamespace )
      .removeClass("oj-menu-context-menu-launcher")
      [0].removeEventListener("click", clickListener, true);
    
    clearTimeout(pressHoldTimer);
    
    var oldMenuData = $element.data("_ojLastContextMenu");

    // If binding's bound value is changing at RT, remove listener from old menu.
    // To avoid memory leak (capture of old menu node), don't assign the node to a var.
    if (oldMenuData) 
      _getContextMenuNode(oldMenuData.selector, oldMenuData.id).off( eventNamespace );
    
    var contextMenuListenerSet = false;


    // 3) Get menu selector/id: ---

    // Accepts anything $() accepts, i.e. same things component CM option accepts,
    // including selector like "#myMenuId", element, JQ object, etc. Also accepts 
    // {}, meaning "use the HTML contextmenu attribute.  Else malformed.
    var menuSelector = ko.utils.unwrapObservable(valueAccessor());

    // if menuSelector is {}, use the id from the contextmenu attr instead. See getContextMenuNode comments.
    var menuId = $.isPlainObject(menuSelector) ? element.getAttribute("contextmenu") : null;

    // Remember how to find menu, without caching menu itself, so that if binding's bound observable is later 
    // changed to point to some other menu, we can clean up the old menu.
    // If/when KO binding is disposed, .data data is discarded, so no leak.
    $element.data("_ojLastContextMenu", {selector: menuSelector, id: menuId});


    // 4) Add listeners to element having context menu (not menu element) : ---

    // Use capture phase to make sure we cancel it before any regular bubble listeners hear it.
    element.addEventListener("click", clickListener, true);

    $element
        .on( "touchstart" + eventNamespace + " " + 
             "mousedown" + eventNamespace + " " +  
             "keydown" + eventNamespace + " ", function( event ) {
            // for mousedown-after-touchend Mobile Safari issue explained above where __contextMenuPressHoldJustEnded is set.
            if (event.type === "mousedown" && getContextMenu().__contextMenuPressHoldJustEnded())
                return;

            // reset isPressHold flag for all events that can start a click.  
            isPressHold = false;

            // start a pressHold timer on touchstart.  If not cancelled before 750ms by touchend/etc., will launch the CM.
            if (event.type === "touchstart") {
                touchInProgress = true;
                pressHoldTimer = setTimeout(launch.bind(undefined, event, "touch", true), pressHoldThreshold);//@HTMLUpdateOK; delaying our own callback
            }

            return true;
        })

        // if the touch ends before the 750ms is up, it's not a long enough tap-and-hold to show the CM
        .on( "touchend" + eventNamespace + " " + 
             "touchcancel" + eventNamespace, function( event ) {
            touchInProgress = false;
            clearTimeout(pressHoldTimer);
            return true;
        })
        .on( "keydown" + eventNamespace + " " + 
             "contextmenu" + eventNamespace, function( event ) {
            if (event.type === "contextmenu" // right-click.  pressHold for Android but not iOS
                    || (event.which == 121 && event.shiftKey)) // Shift-F10
            {
                var eventType = touchInProgress ? "touch" : event.type === "keydown" ? "keyboard" : "mouse";
                launch(event, eventType, false);
            }

            return true;
        })

        // Does 2 things: 
        // 1) Prevents native context menu / callout from appearing in Mobile Safari.  E.g. for links, native CM has "Open in New Tab".
        // 2) In Mobile Safari and Android Chrome, prevents pressHold from selecting the text and showing the selection handles and (in Safari) the Copy/Define callout.
        // In UX discussion, we decided to prevent both of these things for now.  App can theme directly if they have specific needs.
        // Per discussion with architects, do #2 only for touch devices, so that text selection isn't prevented on desktop.  Since #1 
        // is a no-op for non-touch, we can accomplish this by omitting the entire style class, which does 1 and 2, for non-touch.
        // Per comments in scss file, the suppression of 1 and 2 has issues in old versions of Mobile Safari.
        .addClass(oj.DomUtils.isTouchSupported() ? "oj-menu-context-menu-launcher" : "");
  }
};

/**
 * Returns a header renderer function executes the template specified in the binding attribute.
 * (for example, a knockout template).
 * @param {Object} bindingContext the ko binding context
 * @param {Function|string} template the name of the template
 * @return {Function} the renderer function
 * @private
 */
function _getDataGridHeaderRenderer(bindingContext, template)
{
    var nodeStore = {};
    return function(context)
    {
        var parent, childContext;

        parent = context['parentElement'];
        // runs the template
        childContext = bindingContext['createChildContext'](context['data'], null, 
                           function(binding)
                           {
                               binding['$key'] = context['key'];
                               binding['$metadata'] = context['metadata'];
                               binding['$headerContext'] = context;
                           }
                       );
                       
        _executeTemplate(context, template, parent, childContext, nodeStore);

        // tell the datagrid not to do anything
        return null;
    };
};

/**
 * Returns a cell renderer function executes the template specified in the binding attribute.
 * (for example, a knockout template).
 * @param {Object} bindingContext the ko binding context
 * @param {Function|string} template the name of the template
 * @return {Function} the renderer function
 * @private
 */
function _getDataGridCellRenderer(bindingContext, template)
{
    var nodeStore = {};
    return function(context)
    {
        var parent, childContext;

        parent = context['parentElement'];
        // runs the template
        childContext = bindingContext['createChildContext'](context['data'], null, 
                           function(binding)
                           {
                               binding['$keys'] = context['keys'];
                               binding['$metadata'] = context['metadata'];
                               binding['$cellContext'] = context;
                               binding['$cell'] = context['cell'];
                           }
                       );

        _executeTemplate(context, template, parent, childContext, nodeStore);
        
        // tell the datagrid not to do anything
        return null;
    };
};


/**
 * Execute a template and applies relevant afterRender function
 * @param {Object} context the ko binding context
 * @param {Function|string} template the template function or string
 * @param {Element} parent the parent element of the binding
 * @param {Object} childContext the context applied to binding
 * @param {Object} nodeStore place to store the nodeArray
 * @private
 */
function _executeTemplate(context, template, parent, childContext, nodeStore)
{
    var nodesArray, i, useTemplate;
    
    useTemplate = _resolveDataGridTemplate(template, context);
    
    nodesArray = _getClonedNodeArray(useTemplate, nodeStore);
    
    ko.virtualElements.setDomNodeChildren(parent, nodesArray);
    ko.applyBindingsToDescendants(childContext, parent);
    
    for (i = 0; i < parent.childNodes.length; i++)
    {
        if (parent.childNodes[i].nodeType == 1)
        {
            $(parent.childNodes[i])['_ojDetectCleanData']({'cleanParent': true});
            break;
        }
    }
};

/**
 * Get an array of nodes from the template or cached template nodes
 * @param {string} useTemplate the template function or string
 * @param {Object} nodeStore place to store the nodeArray
 * @returns {Array} cloned node array from the template or node store
 * @private
 */
function _getClonedNodeArray(useTemplate, nodeStore)
{
    var nodesArray = nodeStore[useTemplate];
    if (nodesArray == null)
    {
        nodesArray = ko.utils.parseHtmlFragment(document.getElementById(useTemplate).innerHTML);
        nodeStore[useTemplate] = nodesArray;
    }
    
    var newNodesArray = nodesArray.map(function(obj){
        return obj.cloneNode(true);
    });
    
    return newNodesArray;
};

/**
 * If they specify a function for the template get the string of the template by
 * calling the function and passing the cell or header context
 * @param {Function|string} template
 * @param {Object} context
 * @private
 */
function _resolveDataGridTemplate(template, context)
{
    if (typeof template === 'function')
    {
        return template(context);
    }
    return template;
};

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
{
  'attributes': ["header", "cell"],
  'init': function(name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext)
  {
    var row, rowTemplate, column, columnTemplate, cellTemplate, rowEnd, rowEndTemplate, columnEnd, columnEndTemplate;
    if (name === "header")
    {
        // find row template and creates a renderer
        row = value['row'];
        if (row != null)
        {
            rowTemplate = row['template'];
            if (rowTemplate != null)
            {
                row['renderer'] = _getDataGridHeaderRenderer(bindingContext, rowTemplate);
            }
        }

        // find column template and creates a renderer
        column = value['column'];
        if (column != null)
        {
            columnTemplate = column['template'];
            if (columnTemplate != null)
            {
                column['renderer'] = _getDataGridHeaderRenderer(bindingContext, columnTemplate);
            }
        }
        
        // find column template and creates a renderer
        rowEnd = value['rowEnd'];
        if (rowEnd != null)
        {
            rowEndTemplate = rowEnd['template'];
            if (rowEndTemplate != null)
            {
                rowEnd['renderer'] = _getDataGridHeaderRenderer(bindingContext, rowEndTemplate);
            }
        }
        
        // find column template and creates a renderer
        columnEnd = value['columnEnd'];
        if (columnEnd != null)
        {
            columnEndTemplate = columnEnd['template'];
            if (columnEndTemplate != null)
            {
                columnEnd['renderer'] = _getDataGridHeaderRenderer(bindingContext, columnEndTemplate);
            }
        }        
        return {'header': value};
    }
    else if (name === "cell")
    {
        // find the cell template and creates a renderer
        cellTemplate = value['template'];
        if (cellTemplate != null)
        {
            value['renderer'] = _getDataGridCellRenderer(bindingContext, cellTemplate);
        }
        return {'cell': value};
    }
  },
  'update': function(name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext)
  {
    var row, rowTemplate, column, columnTemplate, cellTemplate, rowEnd, rowEndTemplate, columnEnd, columnEndTemplate;
    if (name === "header")
    {
        // find row template and creates a renderer
        row = value['row'];
        if (row != null)
        {
            rowTemplate = row['template'];
            if (rowTemplate != null)
            {
                row['renderer'] = _getDataGridHeaderRenderer(bindingContext, rowTemplate);
            }
        }

        // find column template and creates a renderer
        column = value['column'];
        if (column != null)
        {
            columnTemplate = column['template'];
            if (columnTemplate != null)
            {
                column['renderer'] = _getDataGridHeaderRenderer(bindingContext, columnTemplate);
            }
        }
        
        // find column template and creates a renderer
        rowEnd = value['rowEnd'];
        if (rowEnd != null)
        {
            rowEndTemplate = rowEnd['template'];
            if (rowEndTemplate != null)
            {
                rowEnd['renderer'] = _getDataGridHeaderRenderer(bindingContext, rowEndTemplate);
            }
        }
        
        // find column template and creates a renderer
        columnEnd = value['columnEnd'];
        if (columnEnd != null)
        {
            columnEndTemplate = columnEnd['template'];
            if (columnEndTemplate != null)
            {
                columnEnd['renderer'] = _getDataGridHeaderRenderer(bindingContext, columnEndTemplate);
            }
        }        
        return {'header': value};
    }
    else if (name === "cell")
    {
        // find the cell template and creates a renderer
        cellTemplate = value['template'];
        if (cellTemplate != null)
        {
            value['renderer'] = _getDataGridCellRenderer(bindingContext, cellTemplate);
        }
        return {'cell': value};
    }
    return null;
  },
      
  'for': 'ojDataGrid'
});

function _handleManagedDiagramAttributes(name, value, bindingContext) {
  if (name === "template") {
    return {'_templateFunction': _getDvtDataRenderer(bindingContext, value)};
  }
  return null;
};

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes({
  'attributes': ['template'],
  'init': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedDiagramAttributes(name, value, bindingContext);
  },
  'update': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedDiagramAttributes(name, value, bindingContext);
  },
  'for': 'ojDiagram'
});
(function()
{

  /**
   * @ignore
   */
  oj.__ExpressionUtils = {};
  
  oj.__ExpressionUtils.getPropertyWriterExpression = function(expression)
  { 
    var reserveddWords = ["true", "false", "null", "undefined"];
    
    if (expression == null || reserveddWords.indexOf(expression) >= 0)
    {
      return null;
    }
    
    // Remove the white space on both ends to ensure that the _ASSIGNMENT_TARGET_EXP regexp
    // is matched properly
    expression = expression.trim();
  
    // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
    // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
    // This also will not properly handle nested brackets (e.g., obj1[obj2['prop']];).
    var match = expression.match(_ASSIGNMENT_TARGET_EXP);
    
    if (match === null)
    {
      return null;
    }
    
    var target = match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
    
    return 'function(v){' + target + '=v;}';
  };
  
  var _ASSIGNMENT_TARGET_EXP = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;
})();


/**
 * @ignore
 * @constructor
 */
oj.__ExpressionPropertyUpdater = function(element, bindingContext, isComposite)
{ 
  // This function should be called when the bindings are applied initially and whenever the expression attribute changes
  this.setupExpression = function(attrVal, propName, metadata)
  {
    // See if attribute is a component property by checking for metadata
    var meta = _getPropertyMetadata(propName, metadata);
    if (!meta)
      return;

    var info = oj.__AttributeUtils.getExpressionInfo(attrVal);

    var oldListener = _expressionListeners[propName];
    if (oldListener)
    {
      oldListener['dispose']();
      _expressionListeners[propName] = null;
    }

    // Clean up property change listeners to handler the case when the type of the expression changes
    var changeListener  = _changeListeners[propName];
    if (changeListener)
    {
      element.removeEventListener(propName + _CHANGED_EVENT_SUFFIX, changeListener);
      _changeListeners[propName] = null;
    }

    if (metadata._domListener) {
      var event = oj.__AttributeUtils.eventListenerPropertyToEventType(propName);
      // If the attribute is removed, there won't be a new expression so the remove call
      // below can't be relied upon.  So clean up here as well to handle that case
      _setDomListener(event, null);
    }

    var readOnly = metadata['readOnly'];

    var expr = info.expr;

    if (expr)
    {
      // TODO: consider moving  __CreateEvaluator() to a more generic utility class
      var evaluator = oj.ComponentBinding.__CreateEvaluator(expr);

      if (!readOnly)
      {
        var initialRead = true;
        ko.ignoreDependencies(
          function()
          {
            _expressionListeners[propName] = ko.computed(
              // The read() function for the computed will be called when the computed is created and whenever any of
              // the expression's dependency changes
              function()
              {
                var value = evaluator(bindingContext);
                var unwrappedValue = ko.utils.unwrapObservable(value);

                if (metadata._domListener) {
                  var event = oj.__AttributeUtils.eventListenerPropertyToEventType(propName);
                  _setDomListener(event, unwrappedValue);
                }
                else
                {
                  // We cannot share the same storage with KO because we want to be able to compare values,
                  // so make a copy of the array before setting it.
                  if (Array.isArray(unwrappedValue))
                  {
                    unwrappedValue = unwrappedValue.slice();
                  }
                  
                  if (!initialRead && _throttler)
                  {
                    _throttler.addChange(propName, unwrappedValue);
                  }
                  else
                  {
                    _setElementProperty(propName, unwrappedValue);
                  }
                }
              }
            );
          }
        );
        initialRead = false;
      }

      // Only listen for property changes for writeable properties
      if (metadata['writeback'] && !info.downstreamOnly)
        _changeListeners[propName] = _listenToPropertyChanges(propName, expr, evaluator);

      return true;
    }


    return false;
  }
  
  
  this.teardown = function()
  {
    var names = Object.keys(_expressionListeners);
    for (var i=0; i<names.length; i++)
    {
      var listener = _expressionListeners[names[i]];
      // listener might be null if this attribute changed from an expression to a literal
      if (listener)
        listener['dispose']();
    }
    _expressionListeners = {};


    // reset change listeners
    names = Object.keys(_changeListeners);
    for (i=0; i<names.length; i++)
    {
      var prop = names[i];
      element.removeEventListener(prop + _CHANGED_EVENT_SUFFIX, _changeListeners[prop]);
    }
    _changeListeners = {};

    // dom event listeners
    names = Object.keys(_domListeners);
    for (i=0; i<names.length; i++)
    {
      var event = names[i];
      _setDomListener(event, null);
    }
    _domListeners = {};
    
    if (_throttler)
    {
      _throttler.dispose();
    }
  }

  function _setDomListener(event, listener) {
    if (_domListeners[event]) {
      element.removeEventListener(event, _domListeners[event]);
      _domListeners[event] = null;
    }
    if (listener && listener instanceof Function) {
      _domListeners[event] = listener;
      element.addEventListener(event, listener);
    }
  }

  function _listenToPropertyChanges(propName, expr, evaluator)
  {
    var listener = function(evt)
    {
      if (!_isSettingProperty(propName))
      {
        var written = false;
        var reason;
        ko.ignoreDependencies(
          function()
          {
            var value = evt['detail']['value'];

            var target = evaluator(bindingContext);

            if (ko.isObservable(target))
            {
              if (ko.isWriteableObservable(target))
              {
                target(oj.ComponentBinding.__cloneIfArray(value));
                written = true;
              }
              else
              {
                reason = "the observable is not writeable";
              }
            }
            else
            {
              var writerExpr = oj.__ExpressionUtils.getPropertyWriterExpression(expr);
              if (writerExpr != null)
              {
                // TODO: consider caching the evaluator
                var wrirerEvaluator = oj.ComponentBinding.__CreateEvaluator(writerExpr);
                wrirerEvaluator(bindingContext)(oj.ComponentBinding.__cloneIfArray(value));
                written = true;
              }
              else
              {
                reason = "the expression is not a valid update target";
              }
            }
          }
        );
        
        if (!written)
        {
          if (reason)
          {
            oj.Logger.info("The expression '%s' for property '%s' was not updated because %s.", expr, propName, reason);
          }
        }
      }

    };

    element.addEventListener(propName + _CHANGED_EVENT_SUFFIX, listener);
    return listener;
  }


  function _setElementProperty(propName, value)
  {
    _startSettingProperty(propName);
    try
    {
      element['setProperty'](propName, value);
    }
    finally
    {
      _endSettingProperty(propName);
    }
  }
  
  function _startSettingProperty(propName)
  {
    var count = _settingProperties[propName] || 0;
    count++;
    _settingProperties[propName] = count;
  }
  
  function _endSettingProperty(propName)
  {
    var count = _settingProperties[propName];
    if (!count)
    {
      oj.Logger.error("Property count undefrlow");
      return;
    }
    count--;
    if (count === 0)
    {
      _settingProperties[propName] = null;
    }
    else
    {
      _settingProperties[propName] = count;
    }
  }
  
  function _isSettingProperty(propName)
  {
    return _settingProperties[propName];
  }

  function _getPropertyMetadata(propName, metadata)
  {
    var propPath = propName.split('.');
    var meta = metadata;
    propPath.shift(); // current metadata is already for top level property
    for (var j = 0; j < propPath.length; j++)
    {
      meta = meta['properties'];
      if (!meta)
        break;
      meta = meta[propPath[j]];
    }
    return meta;
  }
  
  function _setupComponentChangeTracker()
  {
    
    //  We are not throttling composite property updates because:
    //  1) Existing customers may expect that properties be updated immediately
    //  2) KO templates do not have any optimizations for simulteneous property updates
    //  3) Updates to embeddded JET components will still be throttled
    if (isComposite)
    {
      return null;
    }
    
    var updater = function(changes)
    {
      var keys = Object.keys(changes);
      for (var i=0; i<keys.length; i++)
      {
        var key = keys[i];
      
        // We rely on the flag set by the _startSettingProperty() to determine whether
        // the property is being changed in response to a subscription notification
        // from KO. Change events from all sets made NOT in response to a KO update 
        // trigger an an attempt to write the value back into the associated expression.
        // If the writeback is not possible for any reason, we consider that the binding
        // has been 'obscured' by a local property set, and further update notifications
        // are are going to be ignored. This means that we are stuck with calling 
        // _startSettingProperty() for all properties in the batch update. 
        // The downside for this approach is that property changes made in response 
        // to a property set from within the same batch will NOT be written back
        // into the KO expression. The likelihood of the writeback bugs because 
        // of this is very low IMO: we have few properties with writeback enabled,
        // and the behavior for the component changing a property whose value is being set
        // in the same batch is already undefined. If some app runs into an issue, the
        // workaround will be to call oj.ComponentBinding.deliverChanges() after each observable
        // change.
        _startSettingProperty(key);
      }
      try
      {
        element['setProperties'](changes);
      }
      finally
      {
        for (var n=0; n<keys.length; n++)
        {
          var k = keys[n];
          _endSettingProperty(k);
        }
      }
    };
     
    return new ComponentChangeTracker(updater, oj.ComponentBinding._changeQueue);
  }
  
  
  var _throttler = _setupComponentChangeTracker();
  
  var _domListeners = {};
  var _expressionListeners = {};
  var _changeListeners = {};
  var _settingProperties = {};
  var _CHANGED_EVENT_SUFFIX = "Changed";
}

/*jslint browser: true*/
/*
** Copyright (c) 2014, Oracle and/or its affiliates. All rights reserved.
*/


/**
 * @class Utilities for creating knockout observables to implement responsive pages. 
 * For example you could use oj.ResponsiveKnockoutUtils.createMediaQueryObservable to 
 * create an observable based on the screen width and then bind the tab bar's 
 * orientation attribute to it. See the method doc below for specific examples.
 * @since 1.1.0
 * @export
 * @ojstatus preview
 */
oj.ResponsiveKnockoutUtils = {};

/**
 * <p>creates an observable that 
 * returns true or false based on a media query string. 
 * Can be used in conjuntion with {@link oj.ResponsiveUtils.getFrameworkQuery}
 * to create an observable based on a framework media query.</p>
 * 
 * <p>Example:</p>
 * <pre class="prettyprint">
 * <code>
 *    var customQuery = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(
 *                                         '(min-width: 400px)');
 *
 *    var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(
 *                             oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);
 *        
 *    self.large = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);
 * </code></pre>
 * 
 * @param {string} queryString media query string, for example '(min-width: 400px)'
 * @return a knockout observable  that 
 *              returns true or false based on a media query string.
 * @export
 * @static
 */
oj.ResponsiveKnockoutUtils.createMediaQueryObservable = function(queryString)
{

  if (queryString == null)
  {
    throw new Error("oj.ResponsiveKnockoutUtils.createMediaQueryObservable: aborting, queryString is null");
  }

  var query = window.matchMedia(queryString);

  var observable = ko.observable(query.matches);

  // add a listener for future changes
  query.addListener(function(query) {
      observable(query.matches);
      //console.log("query listener called! query.matches = " + query.matches + ", size = " + (document.outerWidth || document.body.clientWidth));
  });


 
  // There is a major bug in webkit, tested on ios 7 going from
  // landscape to portrait.
  //    https://bugs.webkit.org/show_bug.cgi?id=123293
  // 
  // Basically if you use a media query in css
  // then the js matchmedia call won't work! 
  //
  // According to the bug this is known to be on webkit 538.4,
  // but I see it on 537.51 as well which is earlier, so 
  // assume the problem exists generally on safari.
  // Chrome now uses blink instead of webkit, but chrome
  // still has webkit in their user agent string, however they
  // now only change the number after "Chrome".
  
  if (navigator.userAgent.indexOf("WebKit") != -1 && 
      navigator.userAgent.indexOf("Chrome") == -1) 
  {
    $(window).resize(function() {
      //console.log("Resize called! Size = " + (document.outerWidth || document.body.clientWidth));

      // Somehow if I change some text in the dom on resize 
      // the query listener is called
      var selector = "oj-webkit-bug-123293";

      if($('body').has("." + selector).length === 0) 
      {
        // setting display: none doesn't work, so using 
        // oj-helper-hidden-accessible because this visually 
        // hides the content without using display:none. 
        // However we don't want screen readers to read 
        // this so setting aria-hidden to true.
        $('body').append('<div aria-hidden="true" class="oj-helper-hidden-accessible ' + selector + '">'); // @HTMLUpdateOK 
      }

      $("." + selector).text((new Date().getMilliseconds()).toString()); // @HTMLUpdateOK 
    });
  }
  
  return observable;
}


/**
 * This function creates a computed observable, the 
 * value of which is one of the {@link oj.ResponsiveUtils.SCREEN_RANGE} constants. 
 * For example when the width is in the 
 * range defined by the sass variable $mediumScreenRange then 
 * the observable returns <code>oj.ResponsiveUtils.SCREEN_RANGE.MD</code>, 
 * but if it's in the range defined by $largeScreenRange then 
 * it returns <code>oj.ResponsiveUtils.SCREEN_RANGE.LG</code>, etc. 
 * 
 * 
 * 
 * <p>Example:</p>
 * <pre class="prettyprint">
 * <code>
 *        // create an observable which returns the current screen range
 *        self.screenRange = oj.ResponsiveKnockoutUtils.createScreenRangeObservable();
 *
 *        self.label2 = ko.computed(function() {
 *          var range = self.screenRange();
 * 
 *          if ( oj.ResponsiveUtils.compare( 
 *                       range, oj.ResponsiveUtils.SCREEN_RANGE.MD) <= 0)
 *          {
 *            // code for when screen is in small or medium range
 *          }
 *          else if (range == oj.ResponsiveUtils.SCREEN_RANGE.XL)
 *          {
 *            // code for when screen is in XL range
 *          }
 *        });
 * </code></pre>
 *
 * @return a knockout observable the value of which is one of the
 *  screen range constants, for example oj.ResponsiveUtils.SCREEN_RANGE.MD
 * @export
 * @static
 */
oj.ResponsiveKnockoutUtils.createScreenRangeObservable = function()
{
  // queryies
  var xxlQuery = oj.ResponsiveUtils.getFrameworkQuery(
                                oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.XXL_UP);

  var xlQuery = oj.ResponsiveUtils.getFrameworkQuery(
                                oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.XL_UP);

  var lgQuery = oj.ResponsiveUtils.getFrameworkQuery(
                                oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP);

  var mdQuery = oj.ResponsiveUtils.getFrameworkQuery(
                                oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);

  var smQuery = oj.ResponsiveUtils.getFrameworkQuery(
                                oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_UP);



  // observables
  var xxlObservable = xxlQuery == null ? 
                      null : 
                      oj.ResponsiveKnockoutUtils.createMediaQueryObservable(xxlQuery);

  var xlObservable = xlQuery == null ? 
                     null : 
                     oj.ResponsiveKnockoutUtils.createMediaQueryObservable(xlQuery);

  var lgObservable = lgQuery == null ? 
                     null : 
                     oj.ResponsiveKnockoutUtils.createMediaQueryObservable(lgQuery);

  var mdObservable = mdQuery == null ? 
                     null : 
                     oj.ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

  var smObservable = smQuery == null ? 
                     null : 
                     oj.ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);


  return ko.computed(function() {
    if (xxlObservable && xxlObservable())
      return oj.ResponsiveUtils.SCREEN_RANGE.XXL; 

    if (xlObservable && xlObservable())
      return oj.ResponsiveUtils.SCREEN_RANGE.XL; 

    if (lgObservable && lgObservable())
      return oj.ResponsiveUtils.SCREEN_RANGE.LG; 

    if (mdObservable && mdObservable())
      return oj.ResponsiveUtils.SCREEN_RANGE.MD; 

    if (smObservable && smObservable())
      return oj.ResponsiveUtils.SCREEN_RANGE.SM; 

    throw new Error(" NO MATCH in oj.ResponsiveKnockoutUtils.createScreenRangeObservable");

  });
}

/**
 * Common method to handle managed attributes for both init and update
 * @param {string} name the name of the attribute
 * @param {Object} value the value of the attribute
 * @param {Object} bindingContext the ko binding context
 * @return {Object} the modified attribute
 * @private
 */
function _handleManagedMapAttributes(name, value, bindingContext) {
  if (name === "areaLayers") {
    for (var i = 0; i < value.length; i++) {
      var areaDataLayer = value[i]['areaDataLayer'];
      if (areaDataLayer) {
        var template = areaDataLayer['template'];
        if (template != null) {
          areaDataLayer['_templateRenderer'] = _getDvtDataRenderer(bindingContext, template);
        }
      }
    }
    return {'areaLayers': value};
  }
  else if (name === "pointDataLayers") {
    for (var i = 0; i < value.length; i++) {
      var template = value[i]['template'];
      if (template != null) {
        value[i]['_templateRenderer'] = _getDvtDataRenderer(bindingContext, template);
      }
    }
    return {'pointDataLayers': value};
  }
  return null;
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes({
  'attributes': ["areaLayers", "pointDataLayers"],
  'init': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedMapAttributes(name, value, bindingContext);
  },
  'update': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedMapAttributes(name, value, bindingContext);
  },
  'for': 'ojThematicMap'
});

/**
 * @export
 */
oj.KnockoutTemplateUtils = {};

/**
 * Returns a renderer for a knockout template.
 * @param {string} template The template name to render
 * @param {boolean=} bReplaceNode True if the entire target node will be replaced by the output of the template.
 *                                If false or omitted, the children of the target node will be replaced.
 * @return {function(Object)}
 * @export
 */
oj.KnockoutTemplateUtils.getRenderer = function(template, bReplaceNode) 
{
  var templateRenderer = function (context) {
    // For DVTs, the node to attach the template to is different than the context's parentElement key
    var parentElement = context['_parentElement'] || context['parentElement'];
    
    var bindingContext = ko.contextFor(context['componentElement']);

    var childContext = bindingContext['createChildContext'](context['data'], null, function(binding) { binding['$context'] = context; });
    ko['renderTemplate'](template, childContext, {'afterRender': function(renderedElement) { $(renderedElement)['_ojDetectCleanData'](); }}, 
      parentElement, bReplaceNode ? 'replaceNode' : 'replaceChildren');
    return null;
  };
  
  return function (context) {
    if (context['componentElement'].classList && context['componentElement'].classList.contains("oj-dvtbase")){
      // Create a dummy div
      var dummyDiv = document.createElement("div");
      dummyDiv.style.display = "none";
      dummyDiv._dvtcontext = context['_dvtcontext'];
      context['componentElement'].appendChild(dummyDiv);
      Object.defineProperty(context, '_parentElement', { 'value': dummyDiv, 'enumerable': false });
      Object.defineProperty(context, '_templateCleanup', { 'value': function(){$(dummyDiv).remove();}, 'enumerable': false });
      Object.defineProperty(context, '_templateName', { 'value': template, 'enumerable': false });

      templateRenderer(context);

      var elem = dummyDiv.children[0];
      if (elem) {
        if (elem.namespaceURI === 'http://www.w3.org/2000/svg') {
          dummyDiv.removeChild(elem);
          $(dummyDiv).remove();
        } 
        return {'insert':elem};
      }
      return {'preventDefault':true};
    }
    else {
      return templateRenderer(context);
    }
  };
};
/**
 * Common method to handle managed attributes for both init and update
 * @param {string} name the name of the attribute
 * @param {Object} value the value of the attribute
 * @param {Object} bindingContext the ko binding context
 * @return {Object} the modified attribute
 * @private
 */
function _handleManagedTreemapAttributes(name, value, bindingContext) {
  if (name === "nodeContent" && value['template']) {
    value['_renderer'] = _getDvtRenderer(bindingContext, value['template']);
  }
  return {'nodeContent': value};
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes({
  'attributes': ["nodeContent"],
  'init': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedTreemapAttributes(name, value, bindingContext);
  },
  'update': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedTreemapAttributes(name, value, bindingContext);
  },
  'for': 'ojTreemap'
});

/**
 * Returns a renderer function and executes the template specified in the binding attribute. (for example, a knockout template).
 * @param {Object} bindingContext the ko binding context
 * @param {string} template the name of the template
 * @return {Function} the renderer function
 * @private
 */
function _getDvtRenderer(bindingContext, template) {
  return function (context) {
    var model = bindingContext['createChildContext'](context['context']);
    ko['renderTemplate'](template, model, {'afterRender': function(renderedElement) { $(renderedElement)['_ojDetectCleanData'](); }}, context['parentElement']);
    return null;
  };
};

/**
 * Returns a renderer function and executes the template specified in the binding attribute for data items. (for example, a knockout template).
 * @param {Object} bindingContext the ko binding context
 * @param {string} template the name of the template
 * @return {Function} the renderer function
 * @private
 */
function _getDvtDataRenderer(bindingContext, template) {
  return function (context) {
    var model = bindingContext['createChildContext'](context['data']);
    ko['renderTemplate'](template, model, {'afterRender': function(renderedElement) { $(renderedElement)['_ojDetectCleanData'](); }}, context['parentElement']);
    return null;
  };
};

/**
 * Common method to handle managed attributes for both init and update
 * @param {string} name the name of the attribute
 * @param {Object} value the value of the attribute
 * @param {Object} bindingContext the ko binding context
 * @return {Object} the modified attribute
 * @private
 */
function _handleManagedTooltipAttributes(name, value, bindingContext) {
  if (name === "tooltip" && value['template']) {
     value['_renderer'] = _getDvtRenderer(bindingContext, value['template']);
  }   
  return {'tooltip': value};
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes({
  'attributes': ["tooltip"],
  'init': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedTooltipAttributes(name, value, bindingContext);
  },
  'update': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedTooltipAttributes(name, value, bindingContext);
  },
  'for': "tooltipOptionRenderer"
});

// Default declarations for all components supporting tooltips
(function() {
  var componentsArray = ['ojChart', 'ojDiagram', 'ojNBox', 'ojPictoChart', 'ojSunburst', 'ojTagCloud', 'ojThematicMap', 'ojTreemap',
                         'ojDialGauge', 'ojLedGauge', 'ojRatingGauge','ojSparkChart', 'ojStatusMeterGauge', 'ojGantt'];
  for(var i = 0; i < componentsArray.length; i++) {
    oj.ComponentBinding.getDefaultInstance().setupManagedAttributes({ 
      "for": componentsArray[i],
      "use": "tooltipOptionRenderer"
    });
  }                   
})();

//
// Define a template source that allows the use of a knockout array (ko[])
// to provide storage for a template string.
//
// This simplifies template assignment and template usage for the user, as shown in the following example:
//
// Template Assignment:
//
//   ko.templates["myKey"] = templateText;
//
// Template Usage:
//
//   <div data-bind="template: {name: myKey}">
//
/*jslint browser: true*/

/**
 * @export
 */
oj.koStringTemplateEngine = {};

/**
 * @export
 */
oj.koStringTemplateEngine.install = function() 
{
    //define a template source that tries to key into an object first to find a template string

    if (ko.templates) return;

    var _templateText = {}; // Stores the text property for the template object.
    var _templateData = {}; // Stores the data property for the template object.

    // data = {},
    var _engine = new ko['nativeTemplateEngine']();

    /**
     *  @constructor
     *  @private
     */

    var StringTemplate = function(template) {

        this._templateName = template;

        this.text = function(value) 
	{
	    // When passed no parameters, return the template object.
            if (!value)
	    {
                return _templateText[this._templateName];
            }

            _templateText[this._templateName] = value;
        };

        this.data = function(key, value)
	{

            if (!_templateData[this._templateName]) {
		_templateData[this._templateName] = {};
            }

            if (arguments.length === 1) {
                return _templateData[this._templateName][key];
            }

            _templateData[this._templateName][key] = value;
        };
    };

    //
    // Override knockout's makeTemplateSource(), returning the new stringTemplate 
    //
    _engine['makeTemplateSource'] = function(template, templateDocument)
    {
	if (typeof template == "string") 
	{
            templateDocument = templateDocument || document;
            var elem = templateDocument.getElementById(template);

            if (elem) 
	    {
		return new ko['templateSources']['domElement'](elem);
	    }
            return new StringTemplate(template);
	}
        if ((template && (template.nodeType == 1)) || (template.nodeType == 8)) 
	{
            return new ko['templateSources']['anonymousTemplate'](template);
        }
    };

    //make the templates accessible
    // ko.templates = _templateText;
    ko.templates = _templateText;

    //make this new template engine our default engine
    ko['setTemplateEngine'](_engine);
};


(function()
{
  ko['bindingHandlers']['_ojCustomElement'] =
  {
    'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
    {
       // Apply child bindings first
       ko.applyBindingsToDescendants(bindingContext, element);
       
       return {'controlsDescendantBindings' : true};
    },
    
    'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext)
    {
      var callbackId = 0;
      var _expressionHandler;
      var attributeListener;
      
      // This instance won't be created unless oj.BaseCustomElementBridge is defined so this call is safe
      var bridge = oj.BaseCustomElementBridge.getInstance(element);

      var propsPromise = bridge.getPropertiesPromise();
      
      function cleanup()
      {
        if (_expressionHandler)
        {
          _expressionHandler.teardown();
          _expressionHandler = null;
        }
        
       
        if(attributeListener)
        {
          element.removeEventListener(_ATTRIBUTE_CHANGED, attributeListener);
          attributeListener = null;
        }
      };
      
      function setup(isComposite)
      {
        var metadataProps = oj.BaseCustomElementBridge.getProperties(bridge);
        _expressionHandler = new oj.__ExpressionPropertyUpdater(element, bindingContext, isComposite);

        // Dummy metadata for passing to the ExpressionPropertyUpdater for DOM listener attributes i.e. on-*
        var domListenerMetadata = {_domListener:true};
        
        // Set a flag on the bridge to indicate that we are initializing expressions from the DOM
        // to avoid overriding any property sets that could have occured after
        bridge._initializingExpressions = true;

        // setupExpression will only update properties defined in metadata so it's safe to iterate through all element attributes
        // including ones defined on the base HTML prototype
        var attrs = element.attributes; // attrs is a NodeList
        for (var i = 0; i < attrs.length; i++)
        {
          var attr = attrs[i];
          var propName = oj.__AttributeUtils.attributeToPropertyName(attr.nodeName);
          var eventName = oj.__AttributeUtils.eventListenerPropertyToEventType(propName);
          var isDomEvent = eventName && !metadataProps[propName];
          _expressionHandler.setupExpression(attr.value, propName, isDomEvent ? domListenerMetadata : metadataProps[propName.split('.')[0]]);
        }
        
        bridge._initializingExpressions = false;

        attributeListener = function(evt)
        {
          var detail = evt['detail'];
          var attr = detail['attribute'];
          var propName = oj.__AttributeUtils.attributeToPropertyName(attr);
          var eventName = oj.__AttributeUtils.eventListenerPropertyToEventType(propName);
          var isDomEvent = eventName && !metadataProps[propName];
          
          var metadata = isDomEvent ? domListenerMetadata : metadataProps[propName.split('.')[0]]; // send metadata for top level property
          _expressionHandler.setupExpression(detail['value'], propName, metadata);
         
        };
            
        element.addEventListener(_ATTRIBUTE_CHANGED, attributeListener);
      };
  
      // Since we are tracking all our dependencies explicitly, we are suspending dependency detection here.
      // update() will be called only once as a result
      ko.ignoreDependencies(
        function()
        {
          ko.computed(
            function()
            {
              // Access valueAccesor to ensure that the binding is re-initialzied when an
              // observable ViewModel is mutated
              var isComposite = valueAccessor().composite;
              
              if (!ko.computedContext.isInitial()) 
              {
                cleanup();
              }
              
              callbackId++;
              
              
              function _createCallbackWithIdMatching(currentId, callback)
              {
                var ret = function(id, value)
                {
                  if (id === callbackId)
                  {
                    callback(value);
                  }
                }.bind(undefined, currentId);
                return ret;
              }
              
              // The propsPromise is resolved synchronously in the connected callback for JET custom elements,
              // but not for composites which are registered asynchronously due to the metadata Promise. Since
              // the 1.0 custom element polyfill calls the connected callback synchronously, the binding provider
              // promises will resolve children first allowing us to ensure that children are ready by the time
              // parents are being created so our internal code can access properties early.
              propsPromise.then(
                _createCallbackWithIdMatching(callbackId,
                  function()
                  {
                    setup(isComposite);
                    oj._KnockoutBindingProvider.getInstance().__NotifyBindingsApplied(element);
                  }
                ),
                _createCallbackWithIdMatching(callbackId,
                  function(reason)
                  {
                    //rejected
                    oj.Logger.error("Custom element binding setup failed. Reason: %o", 
                        reason);
                  }
                )
              );
              
              
            },
            null,
            {'disposeWhenNodeIsRemoved' : element}
          )
        }
      );
  
      ko.utils.domNodeDisposal.addDisposeCallback(element, cleanup);
    
  
  
    }
  }
  
  var _ATTRIBUTE_CHANGED = 'attribute-changed';
})();



/**
 * Common method to handle managed attributes for both init and update
 * @param {string} name the name of the attribute
 * @param {Object} value the value of the attribute
 * @param {Object} bindingContext the ko binding context
 * @return {Object} the modified attribute
 * @private
 */
function _handleManagedGaugeAttributes(name, value, bindingContext) {
  if (name === "center" && value['template']) {
    value['_renderer'] = _getDvtRenderer(bindingContext, value['template']);
  }
  return {'center': value};
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes({
  'attributes': ["center"],
  'init': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedGaugeAttributes(name, value, bindingContext);
  },
  'update': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedGaugeAttributes(name, value, bindingContext);
  },
  'for': 'ojStatusMeterGauge'
});

/*jslint browser: true, devel: true*/

/** 
 * @private
 * @const
 */
var _COLUMNS_ATTR = 'columns';

/** 
 * @private
 * @const
 */
var _COLUMNS_DEFAULT_ATTR = 'columnsDefault';

/** 
 * The row template will be used to render the row elements. 
 * The row, status, and component objects will be available 
 * in the template context.
 * @private
 * @const
 */
var _ROW_TEMPLATE_ATTR = 'rowTemplate';

/**
 * Create and return a renderer which the component will call. That renderer
 * will render the template.
 * @param {Object} bindingContext  Binding Context
 * @param {string} type  'cell' or 'header' or 'row'
 * @param {string} template  template name
 * @return {Object} Renderer
 * @private
 */
function _getTableColumnTemplateRenderer(bindingContext, type, template)
{
  var rendererOption = {};
  (function(template, type) {
    rendererOption = function(params) {
      var childContext = null;
      var parentElement = null;
      if (type == 'header')
      {
        childContext = bindingContext['createChildContext'](null, null,
          function(binding)
          {
            binding['$columnIndex'] = params['columnIndex'];
            binding['$headerContext'] = params['headerContext'];
            binding['$data'] = params['data'];
          });
        parentElement = params['headerContext']['parentElement'];
      }
      else if (type == 'cell')
      {
        var childData = params['row'];
        childContext = bindingContext['createChildContext'](childData, null,
          function(binding)
          {
            binding['$columnIndex'] = params['columnIndex'];
            binding['$cellContext'] = params['cellContext'];
          }
        );
        parentElement = params['cellContext']['parentElement'];
      }
      if (type == 'footer')
      {
        childContext = bindingContext['createChildContext'](null, null,
          function(binding)
          {
            binding['$columnIndex'] = params['columnIndex'];
            binding['$footerContext'] = params['footerContext'];
          });
        parentElement = params['footerContext']['parentElement'];
      }
      ko['renderTemplate'](template, childContext, {
                           'afterRender': function(renderedElement)
                           {
                               $(renderedElement)['_ojDetectCleanData']();
                           }}, parentElement, 'replaceNode');
    };
  }(template, type));

  return rendererOption;
}

/**
 * Create and return a renderer which the component will call. That renderer
 * will render the template.
 * @param {string} template  template name
 * @return {Object} Renderer
 * @private
 */
function _getTableRowTemplateRenderer(bindingContext, template)
{
  return function(params) {
    var childData = params['row'];
    var childContext = bindingContext['createChildContext'](childData, null,
      function(binding)
      {
        binding['$rowContext'] = params['rowContext'];
      }
    );
    ko['renderTemplate'](template, childContext, {
                           'afterRender': function(renderedElement)
                           {
                               $(renderedElement)['_ojDetectCleanData']();
                           }}, params['rowContext']['parentElement'], 'replaceNode');

  };
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
  {
    'attributes': [_COLUMNS_ATTR, _COLUMNS_DEFAULT_ATTR, _ROW_TEMPLATE_ATTR],
    'init': function(name, value, element, widgetConstructor, valueAccessor,
      allBindingsAccessor, bindingContext)
    {
      if (name == _COLUMNS_ATTR || name == _COLUMNS_DEFAULT_ATTR)
      {
        var i, template, footerTemplate, headerTemplate;
        for (i = 0; i < value.length; i++)
        {
          var column = value[i];
          template = column['template'];
          footerTemplate = column['footerTemplate'];
          headerTemplate = column['headerTemplate'];

          if (template != null)
          {
            column['renderer'] = _getTableColumnTemplateRenderer(bindingContext, 'cell', template);
          }
          if (footerTemplate != null)
          {
            column['footerRenderer'] = _getTableColumnTemplateRenderer(bindingContext, 'footer', footerTemplate);
          }
          if (headerTemplate != null)
          {
            column['headerRenderer'] = _getTableColumnTemplateRenderer(bindingContext, 'header', headerTemplate);
          }
        }
        if (name == _COLUMNS_ATTR)
        {
          return {'columns': value};
        }
        else
        {
          return {'columnsDefault': value};
        }
      }
      else if (name == _ROW_TEMPLATE_ATTR)
      {
        return {'rowRenderer': _getTableRowTemplateRenderer(bindingContext, value)};
      }
    },
    'update': function(name, value, element, widgetConstructor, valueAccessor,
      allBindingsAccessor, bindingContext)
    {
      if (name == _COLUMNS_ATTR || name == _COLUMNS_DEFAULT_ATTR)
      {
        var i, template, footerTemplate, headerTemplate;
        for (i = 0; i < value.length; i++)
        {
          var column = value[i];
          template = column['template'];
          footerTemplate = column['footerTemplate'];
          headerTemplate = column['headerTemplate'];

          if (template != null)
          {
            column['renderer'] = _getTableColumnTemplateRenderer(bindingContext, 'cell', template);
          }
          if (footerTemplate != null)
          {
            column['footerRenderer'] = _getTableColumnTemplateRenderer(bindingContext, 'footer', footerTemplate);
          }
          if (headerTemplate != null)
          {
            column['headerRenderer'] = _getTableColumnTemplateRenderer(bindingContext, 'header', headerTemplate);
          }
        }
        if (name == _COLUMNS_ATTR)
        {
          widgetConstructor({'columns': value});
        }
        else
        {
          widgetConstructor({'columnsDefault': value});
        }
      }
      else if (name == _ROW_TEMPLATE_ATTR)
      {
        return {'rowRenderer': _getTableRowTemplateRenderer(bindingContext, value)};
      }
      return null;
    },
    'for': 'ojTable'
  });

oj.__KO_CUSTOM_BINDING_PROVIDER_INSTANCE.addPostprocessor({'getBindingAccessors': _replaceComponentBindingWithV2});



/**
 * This function modifies the return value of getBindingAccessors()
 * to separate bindings for each tracked attributess in the 'inline' ojComponent binding
 * @param node
 * @param bindingContext
 * @param accessorMap
 * @param wrapped
 * @ignore
 */
function _replaceComponentBindingWithV2(node, bindingContext, accessorMap, wrapped)
{
  if (accessorMap == null)
  {
    return null;
  }

  // Remove the old (pre-V2) binding from the accessor map
  var bindingName = _findOwnBinding(accessorMap)
  if (bindingName != null)
  {
    accessorMap = _modifyOjComponentBinding(node, bindingName, wrapped, bindingContext, accessorMap);
  }

  return accessorMap;
}

/**
 * @ignore
 */
function _findOwnBinding(accessorMap)
{
  var keys = Object.keys(accessorMap)
  for (var i=-0; i<keys.length; i++)
  {
    var key = keys[i];
    if (oj.ComponentBinding._isNameRegistered(key))
    {
      return key;
    }
  }
  return null;
}

/**
 * @param node
 * @param bindingName
 * @param wrapped
 * @param bindingContext
 * @param accessorMap
 * @ignore
 */
function _modifyOjComponentBinding(node, bindingName, wrapped, bindingContext, accessorMap)
{
  var info = _getBindingValueInfo(node, bindingName, wrapped, bindingContext);

  var bindingList = info.attrList;

  if (bindingList == null) // binding is specified externally (as opposed to an 'inline' object literal)
  {
    return accessorMap;
  }

  var bindingMap = {};
  _keyValueArrayForEach(bindingList,
    function(key, value)
    {
      bindingMap[key] = value;
    }
  );

  // clone the original accessor map
  accessorMap = oj.CollectionUtils.copyInto({}, accessorMap);

  //Add accessor for the V2 version of the Component bidning
  accessorMap[bindingName] =
                      _getOjComponent2BindingAccessor(bindingContext, bindingMap, info.bindingExpr);

  return accessorMap;

}

/**
 * @ignore
 */
function _getOjComponent2BindingAccessor(bindingContext, attributeMap, bindingExpr)
{
  var accessorFunc = function()
  {
    var accessor = {};
    Object.keys(attributeMap).forEach(
      function(option)
      {
        var expression = attributeMap[option];

        // bindingContext will be passed as as the first parameter to the evaluator
        var getter = oj.ComponentBinding.__CreateEvaluator(expression).bind(null, bindingContext);

        Object.defineProperty(accessor, option,
          {
            'get': getter,
            'enumerable': true
          }
        );
      }
    );

    Object.defineProperty(accessor, oj.ComponentBinding._OPTION_MAP,
      {
        'value': attributeMap
        /* not enumerable */
      }
    );

    return accessor;
  }

  // Define toString() for the custom accessor function since we do not want the entire function body to show up in
  // the log whenever a binding evaluation error occurs
  accessorFunc.toString = function(){return bindingExpr;};

  return accessorFunc;
}


/**
 * @param node
 * @param wrapped
 * @param bindingContext
 * @ignore
 */
function _getBindingString(node, wrapped, bindingContext)
{
  var func = wrapped['getBindingsString'];
  if (func)
  {
    return func.call(wrapped, node, bindingContext);
  }

  switch (node.nodeType)
  {
    case 1: // Element
      return node.getAttribute("data-bind");

    case 8: // Comment node
      var match = node.nodeValue.match(/^\s*ko(?:\s+([\s\S]+))?\s*$/);
      return  (match ? match[1]: null);
  }
  return null;
}

/**
 * @param node
 * @param bindingName
 * @param wrapped
 * @param bindingContext
 * @ignore
 */
function _getBindingValueInfo(node, bindingName, wrapped, bindingContext)
{
  var list = null;

  var bindingString = _getBindingString(node, wrapped, bindingContext);
  var keyValueArray = ko.jsonExpressionRewriting.parseObjectLiteral(bindingString);

  var selfVal = null;

  _keyValueArrayForEach(keyValueArray,
    function(key, value)
    {
      if (key === bindingName)
      {
        selfVal = value;
        return true;
      }
      return false;
    }
  );

  if (selfVal != null)
  {
    // check for object literal
    if (selfVal.indexOf('{') === 0)
    {
      list = ko.jsonExpressionRewriting.parseObjectLiteral(selfVal);
    }
  }

  return {attrList: list, bindingExpr: selfVal};
}

function _keyValueArrayForEach(array, callback)
{
  for(var i=0; i<array.length; i++)
  {
    var entry = array[i];
    var key = entry['key'];
    var value = entry['value'];
    if (key != null && value != null && callback(key.trim(), value.trim()))
    {
      break;
    }
  }
}


oj.__KO_CUSTOM_BINDING_PROVIDER_INSTANCE.addPostprocessor(
  {
    'nodeHasBindings': function(node, wrappedReturn)
    {
      if (!oj.BaseCustomElementBridge)
        return wrappedReturn;
      return wrappedReturn || (node.nodeType === 1 && oj.BaseCustomElementBridge.getRegistered(node.nodeName));
    },

    'getBindingAccessors': function(node, bindingContext, wrappedReturn)
    {
      if (node.nodeType === 1 && oj.BaseCustomElementBridge)
      {
        var name = node.nodeName;
        var info = oj.BaseCustomElementBridge.getRegistered(name);
        
        if (info)
        {
          wrappedReturn = wrappedReturn || {};

          wrappedReturn['_ojCustomElement'] = function() {return {composite: info.composite}}

        }
      }

      return wrappedReturn;
    }
  }
);

/**
 * Common method to handle managed attributes for both init and update
 * @param {string} name the name of the attribute
 * @param {Object} value the value of the attribute
 * @param {Object} bindingContext the ko binding context
 * @return {Object} the modified attribute
 * @private
 */
function _handleManagedSunburstAttributes(name, value, bindingContext) {
  if (name === "rootNodeContent" && value['template']) {
    value['_renderer'] = _getDvtRenderer(bindingContext, value['template']);
  }
  return {'rootNodeContent': value};
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes({
  'attributes': ["rootNodeContent"],
  'init': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedSunburstAttributes(name, value, bindingContext);
  },
  'update': function (name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext) {
    return _handleManagedSunburstAttributes(name, value, bindingContext);
  },
  'for': 'ojSunburst'
});

/**
 * @ignore
 * @constructor
 */
oj._KnockoutBindingProvider = function()
{
  /**
   * @ignore
   */
  this.whenReady = function(elem)
  {
    return _getReadyMediatorInstance(elem).getPromise();
  }
  
  /**
   * @ignore
   */
  this.addDisposeCallback =  function(elem, callback)
  {
    ko.utils.domNodeDisposal.addDisposeCallback(elem, callback);
  }
  

  /**
   * @ignore
   */
  this.__NotifyBindingsApplied = function(elem)
  {
    _getReadyMediatorInstance(elem).resolve(true);
  }

  /**
   * @ignore
   */
  function _getReadyMediatorInstance(elem)
  {
    var prop = "_ojBndMdtr";
    var mediator = elem[prop];
    if (!mediator)
    {
      mediator = new ElementMediator();
      Object.defineProperty(elem, prop, {'value': mediator});
    }
    return mediator;
  }
  
  /**
   * @ignore
   * @constructor
   */
  function ElementMediator()
  {
    this.getPromise = function()
    {
      if (!_promise)
      {
        _promise = new Promise(function(resolve){_resolver = resolve;});
      }
      return _promise;
    };
    
    this.resolve = function(val)
    {
      if (_resolver)
      {
        _resolver(val);
        _resolver = null;
      }
      else if (!_promise)
      {
        _promise = Promise.resolve(val);
      }
    }
    
    var _promise;
    var _resolver;
  }
}

/**
 * @ignore
 */
oj._KnockoutBindingProvider.getInstance = function()
{
  return oj._KnockoutBindingProvider._instance;
}

/**
 * @ignore
 */
oj._KnockoutBindingProvider._instance = new oj._KnockoutBindingProvider();





/**
 * Returns a renderer function executes the template specified in the binding attribute.
 * (for example, a knockout template).
 * @param {Object} bindingContext the ko binding context
 * @param {string} template the name of the template
 * @return {Function} the renderer function
 * @private
 */
function _getListViewItemRenderer(bindingContext, template)
{
    return function(context)
    {
        var parent, childContext;

        parent = context['parentElement'];
        // runs the template
        childContext = bindingContext['createChildContext'](context['data'], null, 
                           function(binding)
                           {
                               binding['$itemContext'] = context;
                           }
                       );
        ko['renderTemplate'](template, childContext, {
                           'afterRender': function(renderedElement)
                           {
                               $(renderedElement)['_ojDetectCleanData']();
                           }}, parent, 'replaceNode');

        // tell the listview not to do anything
        return null;
    };
}

/**
 * Common method to handle managed attributes for both init and update
 * @param {string} name the name of the attribute
 * @param {Object} value the value of the attribute
 * @param {Object} bindingContext the ko binding context
 * @return {Object} the modified attribute
 * @private
 */
function _handleListViewManagedAttributes(name, value, bindingContext)
{
    if (name == "item")
    {
      // find the cell template and creates a renderer
      var template = value['template'];
      if (template != null)
      {
        value['renderer'] = _getListViewItemRenderer(bindingContext, template);
      }

      return {'item': value};
    }

    return null;
}

oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
{
  'attributes': ["item"],
  'init': function(name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext)
  {
    var result = _handleListViewManagedAttributes(name, value, bindingContext);
    if (result != null)
        return result;
  },
  'update': function(name, value, element, widgetConstructor, valueAccessor, allBindingsAccessor, bindingContext)
  {
    return _handleListViewManagedAttributes(name, value, bindingContext);
  },
      
  'for': 'ojListViewRenderer'
});

/**
 * Default declaration for ojListView
 */
oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
{
  'for': 'ojListView',
  'use': 'ojListViewRenderer'
});

/**
 * Default declaration for ojListView
 */
oj.ComponentBinding.getDefaultInstance().setupManagedAttributes(
{
  'for': 'ojNavigationList',
  'use': 'ojListViewRenderer'
});


return oj._KnockoutBindingProvider.getInstance();});
