'use strict';

// To appease jshint.
var React = window.React;

var SearchResultItem = React.createClass({
  displayName: 'SearchResultItem',
  onClick: function() {
    var focusTab = function () {
      chrome.tabs.update(this.props.item.id, {active: true});
    }.bind(this);
    chrome.windows.getLastFocused(function(focusedWindow){
      if (focusedWindow.id !== this.props.item.windowId) {
        chrome.windows.update(this.props.item.windowId, {focused: true}, function() {
          focusTab();
        });
      }
      else {
        focusTab();
      }
    }.bind(this));
  },
  render: function() {
    console.log('item render', this.props);
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
        height: 16
      }),
      React.createElement('span', {}, [this.props.item.title])
    ]);
    console.log('did render');
    return ret;
  }
});

var SearchResultItems = React.createClass({
  displayName: 'SearchResultItems',
  render: function() {
    return React.createElement('ul', {
      className: 'list-group'
    }, this.props.items.filter(this.props.showItem).map(function(item, itemIndex) {
      console.log('items props', this.props);
      return React.createElement(SearchResultItem, {
        item: item,
        key: item.id,
        focused: (itemIndex === this.props.focusedIndex)
      });
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
      if (this.state.focusedIndex === this.props.items.length-1) {
        return;
      }
      else {
        this.setState ({
          focusedIndex: this.state.focusedIndex+1
        });
      }
    }
    if (e.key === 'ArrowUp') {
      if (this.state.focusedIndex === 0) {
        return;
      }
      else {
        this.setState ({
          focusedIndex: this.state.focusedIndex-1
        });
      }
    }
  },
  render: function() {
    return React.createElement('div', {}, [
      React.createElement('div', {}, [
        React.createElement(SearchBoxInput, {
          handleChange: this.filterTextChange,
          handleKeyDown: this.onKeyDown
        }, [])
      ]),
      React.createElement('div', {}, [
        React.createElement(SearchResultItems, {
          items: this.props.items,
          focusedIndex: this.state.focusedIndex,
          showItem: this.showItem
        }, [])
      ])
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

// console.log('\'Allo \'Allo! Popup');
