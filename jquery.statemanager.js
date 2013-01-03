(function($, window) {
    $.StateManager = function(inDefaultState, debugEnabled) {
        var self = {},
            properties = [], // List of tracked properties
            currentState = {}, // Internal state representation
            defaultState = {}, // LUT for default values
            // Table for callbacks
            defaultTopic = 'change', topicPrefix = 'change:', callbacks = {},
            // Accessors for manipulating history-able state (the real source of truth)
            writeStateString, readStateString, bindPropagateCallback,
            // Logging function; a noop without debugEnabled
            log = (debugEnabled && console && $.isFunction(console.log))
                ? function () { console.log(arguments); }
                : $.noop;

        // Setup based properties, default values in inDefaultState
        // Sets up the properties list, defaultState LUT, property-specific callback list, and the accessors
        for (var inProp in inDefaultState) {
            if (inDefaultState.hasOwnProperty(inProp)) {
                properties.push(inProp);
                defaultState[inProp] = inDefaultState[inProp];
                callbacks[topicPrefix + inProp] = $.Callbacks('unique');
            }
            // Accessor for each property. 
            // No argument version (getter) returns current value.
            // Single argument (setter) changes that property value (and returns self for chaining).
            self[inProp] = generatePropertyAccessor(inProp);
        }
        callbacks[defaultTopic] = $.Callbacks('unique');
        log("StateManager::ctor", { properties: properties, defaultState: defaultState, currentState: currentState });

        // Utility to create each acce  ssor
        function generatePropertyAccessor(prop) {
            return function(newValue) {
                var currentValue = currentState[prop] || defaultState[prop];
                if (!newValue) {
                    log("StateManager::" + prop + "(getter)", currentValue);
                    return currentValue;
                }
                log("StateManager::" + prop + "(setter)", currentValue, newValue);
                if (newValue !== currentValue) {
                    var newState = $.extend({}, currentState);
                    newState[prop] = newValue;
                    log("StateManager::" + prop + "(setter)", newState);
                    self.pushState(newState);
                }
                return self;
            };
        }

        readStateString = function() {
            var stateString = window.location.hash.slice(2);
            return $.deparam(stateString, true);
        };

        writeStateString = function(stateString) {
            window.location.hash = '?' + stateString;
        };

        bindPropagateCallback = function(propagateCallback) {
            $(window).on('hashchange', propagateCallback);
        };

        // propagateState(): get the state from store, find changes, send notifications as needed
        self.propagateState = function() {
            var newStateInfo = readStateString(), changedProperties = [];
            log("StateManager::propagateState", newStateInfo);
            for (var i = 0; i < properties.length; i++) {
                var prop = properties[i], newValue = newStateInfo[prop] || defaultState[prop], oldValue = currentState[prop];
                if (newValue !== oldValue) {
                    if (newValue === defaultState[prop] && currentState[prop]) {
                        delete currentState[prop];
                    } else {
                        currentState[prop] = newValue;
                    }
                    changedProperties.push(prop);
                }
            }
            log("StateManager::propagateState changedProperties", changedProperties);
            if (changedProperties.length > 0) {
                log("StateManager::propagateState change.fire");
                callbacks[defaultTopic].fire(changedProperties);
                for (i = 0; i < changedProperties.length; i++) {
                    prop = changedProperties[i];
                    log("StateManager::propagateState change.fire", prop, currentState[prop]);
                    callbacks[topicPrefix + prop].fire(currentState[prop] || defaultState[prop]);
                }
            }
            return changedProperties;
        };

        // pushState(stateToPush): change the managed state
        // stateToPush: Object containing state CHANGES only
        self.pushState = function(stateToPush) {
            var state = {}, stateString;
            for (var prop in stateToPush) {
                if ($.inArray(prop, properties) >= 0 && stateToPush[prop] !== defaultState[prop]) {
                    state[prop] = stateToPush[prop];
                }
            }
            stateString = $.param(state);
            log("StateManager::pushState", state, stateString);
            writeStateString(stateString);
        };

        function getTopicCallbackFromArgs(args) {
            var topic, callback;
            log("StateManager::getTopicCallbackFromArgs", args, args.length, args[0]);
            if (args.length === 1 && $.isFunction(args[0])) {
                topic = defaultTopic;
                callback = args[0];
            } else if (args.length === 2 && callbacks[args[0]] && $.isFunction(args[1])) {
                topic = args[0];
                callback = args[1];
            } else {
                return null;
            }
            return { topic: topic, callback: callback };
        }

        // on(callback): adds a callback for changes in any property of the state
        // on('change:<property>', callback): adds a callback for changes in a particular property
        self.on = function() {
            var parsedArgs = getTopicCallbackFromArgs(arguments);
            if (parsedArgs) {
                log("StateManager::on", parsedArgs.topic);
                callbacks[parsedArgs.topic].add(parsedArgs.callback);
            } else {
                log("StateManager::on could not parse arguments", arguments);
            }
        };

        // off(callback): removes a callback for changes in any property of the state
        // off('change:<property>', callback): removes a callback for changes in a particular property
        self.off = function() {
            var parsedArgs = getTopicCallbackFromArgs(arguments);
            if (parsedArgs) {
                log("StateManager::off", parsedArgs.topic);
                callbacks[parsedArgs.topic].remove(parsedArgs.callback);
            } else {
                log("StateManager::off could not parse arguments", arguments);
            }
        };

        // start(): Get the 
        self.start = function() {
            var propagateCallback = function() { self.propagateState(); };
            log("StateManager::start");
            bindPropagateCallback(propagateCallback);
            this.propagateState();
        };

        return self;
    };
})(jQuery, window);