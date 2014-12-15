'use strict';

// To appease jshint.
var React = window.React;
var $ = window.$;

function switchToTab(tabInfo) {
  var focusTab = function() {
    chrome.tabs.update(tabInfo.id, {active: true});
  };
  chrome.windows.getLastFocused(function(focusedWindow) {
    if (focusedWindow.id !== tabInfo.windowId) {
      chrome.windows.update(tabInfo.windowId, {focused: true}, function() {
        focusTab();
      });
    }
    else {
      focusTab();
    }
  });
}

var SearchResultItem = React.createClass({
  displayName: 'SearchResultItem',
  onClick: function() {
    switchToTab(this.props.item);
  },
  render: function() {
    var cx = React.addons.classSet;
    var ret = React.createElement('li', {
      className: cx({
        'list-group-item': true,
        'active': this.props.focused
      }),
      onClick: this.onClick
    }, [
      React.createElement('img', {
        src: this.props.item.favIconUrl,
        width: 16,
        height: 16,
        key: 'image'
      }),
      React.createElement('span', {key: 'title'}, this.props.item.title)
    ]);
    return ret;
  }
});

var SearchResultItems = React.createClass({
  displayName: 'SearchResultItems',
  getInitialState: function() {
    return {
      focusedID: null
    };
  },
  getFocusedItemIdx: function() {
    for (var idx = 0; idx < this.props.items.length; idx++) {
      if (this.props.items[idx].id === this.state.focusedID) {
        return idx;
      }
    }
    return null;
  },
  // `dir` is 1 if we want to move the focused element down, and -1 if we want
  // to move it up.
  moveFocused: function(dir) {
    var focusedIdx = this.getFocusedItemIdx();
    // If we haven't focused anything, or if the item we've focused is no
    // longer in list.
    if (this.state.focusedID === null || focusedIdx === null) {
      // ...and the direction is down, the first item is what we want.
      if (dir === 1) {
        this.selectItemByID(this.props.items[0].id);
      }
      // ...and the direction is up, the first item is what we want.
      else if (dir === -1) {
        this.selectItemByID(this.props.items[this.props.items.length-1].id);
      }
      return;
    }
    if (dir === 1) {
      if (focusedIdx >= this.props.items.length-1) {
        return;
      }
      this.selectItemByID(this.props.items[focusedIdx+1].id);
    }
    else if (dir === -1) {
      if (focusedIdx === 0) {
        return;
      }
      this.selectItemByID(this.props.items[focusedIdx-1].id);
    }
  },
  openFocused: function() {
    var focusedIdx = this.getFocusedItemIdx();
    if (focusedIdx === null) {
      return;
    }
    switchToTab(this.props.items[focusedIdx]);
  },
  selectItemByID: function(itemID) {
    // After this.state.focusedID is updated, scroll the pane to the
    // corresponding element.
    this.setState({
      focusedID: itemID
    }, this.scrollToFocused);
  },
  scrollToFocused: function() {
    // Stop any current animations
    $(this.getDOMNode()).stop();
    // Animate the scroll to the focused element
    var scrollOffset = $(this.getDOMNode()).scrollTop();
    var scrollAmount = $(this.refs.focusedElement.getDOMNode()).position().top + scrollOffset;
    $(this.getDOMNode()).animate({
      scrollTop: scrollAmount
    }, 100);
  },
  render: function() {
    return React.createElement('ul', {
      className: 'list-group tab-results'
    }, this.props.items.map(function(item) {
      var itemProps = {
        item: item,
        key: item.id,
        focused: this.state.focusedID === item.id
      };
      if (itemProps.focused) {
        itemProps.ref = 'focusedElement';
      }
      return React.createElement(SearchResultItem, itemProps);
    }.bind(this)));
  }
});

var SearchBoxInput = React.createClass({
  displayName: 'SearchBoxInput',
  componentDidMount: function() {
    this.refs.inputBox.getDOMNode().focus();
  },
  render: function() {
    return React.createElement('input', {
      type: 'search',
      className: 'form-control',
      ref: 'inputBox',
      onChange: this.props.handleChange,
      onKeyDown: this.props.handleKeyDown
    }, []);
  }
});

var SearchBox = React.createClass({
  displayName: 'SearchBox',
  getInitialState: function() {
    return {
      filterText: '',
      focusedIndex: 0
    };
  },
  filterTextChange: function(evt) {
    this.setState({
      filterText: evt.target.value
    });
  },
  showItem: function(item) {
    return item.title.indexOf(this.state.filterText) >= 0 ||
           item.url.indexOf(this.state.filterText) >= 0;
  },
  onKeyDown: function(e) {
    if (e.key === 'ArrowDown') {
      this.refs.items.moveFocused(1);
    }
    if (e.key === 'ArrowUp') {
      this.refs.items.moveFocused(-1);
    }
    if (e.key === 'Enter') {
      this.refs.items.openFocused();
    }
    if (e.key === 'Escape') {
      window.close();
    }
  },
  render: function() {
    return React.createElement('div', {}, [
      React.createElement('div', {key: 'input'},
        React.createElement(SearchBoxInput, {
          handleChange: this.filterTextChange,
          handleKeyDown: this.onKeyDown
        })
      ),
        React.createElement(SearchResultItems, {
          items: this.props.items.filter(this.showItem),
          ref: 'items'
        })
      ]);
  }
});

var TabMagic = React.createClass({
  displayName: 'TabMagic',
  getInitialState: function() {
    return {
      items: [],
      loaded: false
    };
  },
  componentDidMount: function() {
    chrome.tabs.query({}, function(tabs) {
      this.setState({
        items: tabs,
        loaded: true
      });
    }.bind(this));
  },
  render: function() {
    if (this.props.loading) {
      return React.createElement('div', {}, 'Loading...');
    }
    else {
      return React.createElement(SearchBox, {items: this.state.items}, []);
    }
  }
});

React.render(React.createElement(TabMagic, {}, []), document.getElementById('main_container'));
