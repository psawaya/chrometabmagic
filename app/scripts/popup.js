'use strict';

// To appease jshint.
var React = window.React;

var SearchResultItem = React.createClass({
  displayName: 'SearchResultItem',
  onClick: function() {
    var focusTab = (function () {
      chrome.tabs.update(this.props.id, {active: true});
    }).bind(this);
    chrome.windows.getLastFocused(function(focusedWindow){
      if (focusedWindow.id !== this.props.windowId) {
        chrome.windows.update(this.props.windowId, {focused: true}, function() {
          focusTab();
        });
      }
      else {
        focusTab();
      }
    }.bind(this));
  },
  render: function() {
    return React.createElement('li', {
      className: 'list-group-item',
      onClick: this.onClick
    }, [
      React.createElement('img', {
        src: this.props.favIconUrl,
        width: 16,
        height: 16
      }),
      React.createElement('span', {}, [this.props.title])
    ]);
  }
});

var SearchResultItems = React.createClass({
  displayName: 'SearchResultItems',
  render: function() {
    return React.createElement('ul', {
      className: 'list-group'
    }, this.props.items.map(function(item) {
      var itemPlusKey = item;
      // React needs this to keep track of lists.
      itemPlusKey.key = item.id;
      return React.createElement(SearchResultItem, itemPlusKey, []);
    }));
  }
});

var SearchBox = React.createClass({
  displayName: 'SearchBox',
  render: function() {
    return React.createElement('div', {}, [
      React.createElement('div', {}, [
        React.createElement('input', {
          type: 'search',
          className: 'form-control'
        }, [
        ])
      ]),
      React.createElement('div', {}, [
        React.createElement(SearchResultItems, {items: this.props.items}, [])
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
