jquery.statemanager
===================

**Plugin for a history-enabled state manager.**

Creates an object that manages system-wide state, where changes in state cause changes in
the browser hash fragment, meaning that changes are browser-history-enabled and bookmarkable.

## Usage

```javascript
// jQuery, jquery.deparam, and jquery.statemanager already loaded
app = (function() {
  var state = $.StateManager.new({foo: "alpha", bar: "beta", baz: "gamma"});
  // ... other setup 
  var setup = function () {
    // State accessors
    $('#changeFooButton').click(function() {
      state.foo("New Value");
    });
    
    // Any state change
    state.on('change', function(changedProperties) {
      $("#displayFoo").text(state.foo());
      $("#displayBar").text(state.bar());
      $("#displayBaz").text(state.baz());
    });

    // Foo state change
    state.on('change:foo', function(newValue) {
      // Respond to the new value of property foo
    })

    state.start();
  };

  return {
    state: state,
    setup: setup
    // ... 
  };
  }
})();

$(app.setup);
```

## Features

* Default values for state properties
* Get/set accessors for the properties
* Subscriptions for any event change, or individual properties

## Dependencies

* jQuery
* `jquery.deparam`, as originated by Ben Alman in his 
  [jQuery BBQ plugin](http://benalman.com/code/projects/jquery-bbq/examples/deparam/).
  (Chris Rogers now maintains a [convenient standalone version](http://github.com/chrissrogers/jquery-deparam).)

## Browsers

Currently, `jquery.statemanager` supports Internet Explorer 8 and modern browsers.

The limitation is that the plugin pushes its state into `window.location.hash`, and relies on the 
`hashchange` event. This is not supported in Internet Explorer 7 and earlier. 
