'use strict';

// To appease jshint.
var React = window.React;

var testData = {
  items: [
    {
      title: 'Foo'
    },
    {
      title: 'Bar'
    }
  ]
};

var SearchResultItem = React.createClass({
  displayName: 'SearchResultItem',
  render: function() {
    return React.createElement('div', {}, 'I\'m an item!');
  }
});

var SearchResultItems = React.createClass({
  displayName: 'SearchResultItems',
  render: function() {
    return React.createElement('div', {}, this.props.items.map(function(item) {
      return React.createElement(SearchResultItem, item, []);
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
        React.createElement(SearchResultItems, {items: this.props.data.items}, [])
      ])
    ]);
  }
});

React.render(React.createElement(SearchBox, {data: testData}), document.getElementById('main_container'));


// console.log('\'Allo \'Allo! Popup');
