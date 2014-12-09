'use strict';

// To appease jshint.
var React = window.React;

var SearchResultItem = React.createClass({
  displayName: 'SearchResultItem',
  render: function() {
    return React.createElement('div', {}, [
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
    return React.createElement('div', {}, this.props.items.map(function(item) {
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
          type: 'input'
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
      // console.log(tabs);
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
