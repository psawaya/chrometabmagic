'use strict';

// To appease jshint.
var React = window.React;
var $ = window.$;

var TabMagicMain = null;

var bookmarkFolderID = null;

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

function createOrGetBookmarkFolder() {
  chrome.storage.sync.get('bookmarkFolderID', function(result) {
    if (result.bookmarkFolderID) {
      bookmarkFolderID = result.bookmarkFolderID;
    }
    else {
      chrome.bookmarks.create({
        title: 'Quicksaved Tabs'
      }, function(folder) {
        bookmarkFolderID = folder.id;
        chrome.storage.sync.set({bookmarkFolderID: folder.id});
      });
    }
  });
}

createOrGetBookmarkFolder();

var SearchResultItem = React.createClass({
  displayName: 'SearchResultItem',
  onClick: function() {
    switchToTab(this.props.item);
  },
  onMouseOver: function() {
    this.props.parent.selectItemByID(this.props.item.id, true);
  },
  render: function() {
    var cx = React.addons.classSet;
    var ret = React.createElement('li', {
      className: cx({
        'list-group-item': true,
        'tab-result-item': true,
        'active': this.props.focused
      }),
      onMouseEnter: this.onMouseOver,
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
  bookmarkFocused: function() {
    var tab = this.props.items[this.getFocusedItemIdx()];
    chrome.bookmarks.create({
      title: tab.title,
      url: tab.url,
      parentId: bookmarkFolderID
    });
  },
  closeFocused: function() {
    var focusedIdx = this.getFocusedItemIdx();
    var focusedTabID = this.props.items[focusedIdx].id;
    var nextTab = this.props.items[focusedIdx+1];
    chrome.tabs.remove(focusedTabID, function() {
      TabMagicMain.loadTabs([focusedTabID], function() {
        // If we can, advance to select the next tab.
        if (nextTab) {
          this.selectItemByID(nextTab.id);
        }
      }.bind(this));
    }.bind(this));
  },
  getFocusedItemIdx: function() {
    for (var idx = 0; idx < this.props.items.length; idx++) {
      if (this.props.items[idx].id === this.state.focusedID) {
        return idx;
      }
    }
    return null;
  },
  // `dir` is the number of tabs to navigate up/down. Can be positive or
  // negative.
  moveFocused: function(dir) {
    var focusedIdx = this.getFocusedItemIdx();
    var newFocusIdx = focusedIdx + dir;
    // If we haven't focused anything, or if the item we've focused is no
    // longer in list.
    if (this.state.focusedID === null || focusedIdx === null) {
      // ...and the direction is down, the first item is what we want.
      if (dir > 0) {
        this.focusFirst();
      }
      // ...and the direction is up, the first item is what we want.
      else if (dir < 0) {
        this.focusLast();
      }
      return;
    }
    if (newFocusIdx > this.props.items.length-1) {
      this.focusLast();
    }
    else if (newFocusIdx < 0) {
      this.focusFirst();
    }
    else {
      this.focusByIdx(newFocusIdx);
    }
  },
  focusByIdx: function(idx) {
    if (this.props.items[idx]) {
      this.selectItemByID(this.props.items[idx].id);
    }
  },
  focusFirst: function() {
    this.focusByIdx(0);
  },
  focusLast: function() {
    this.focusByIdx(this.props.items.length-1);
  },
  openFocused: function() {
    var focusedIdx = this.getFocusedItemIdx();
    if (focusedIdx === null) {
      return;
    }
    switchToTab(this.props.items[focusedIdx]);
  },
  selectItemByID: function(itemID, dontScroll) {
    var afterSetState = dontScroll ? function(){} : this.scrollToFocused;
    // After this.state.focusedID is updated, scroll the pane to the
    // corresponding element.
    this.setState({
      focusedID: itemID
    }, afterSetState);
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
        focused: this.state.focusedID === item.id,
        parent: this
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
      filterText: ''
    };
  },
  ensureItemSelected: function() {
    if (this.refs.items.getFocusedItemIdx() === null) {
      if (this.refs.items.props.items.length > 0) {
        this.refs.items.selectItemByID(this.refs.items.props.items[0].id);
      }
    }
  },
  filterTextChange: function(evt) {
    this.setState({
      filterText: evt.target.value
    }, this.ensureItemSelected);
  },
  showItem: function(item) {
    var lowerCaseFilterText = this.state.filterText.toLowerCase();
    return item.title.toLowerCase().indexOf(lowerCaseFilterText) >= 0 ||
           item.url.toLowerCase().indexOf(lowerCaseFilterText) >= 0;
  },
  onKeyDown: function(e) {
    if (e.key === 'ArrowDown') {
      if (e.metaKey) {
        this.refs.items.focusLast();
      }
      else {
        this.refs.items.moveFocused(1);
      }
    }
    if (e.key === 'ArrowUp') {
      if (e.metaKey) {
        this.refs.items.focusFirst();
      }
      else {
        this.refs.items.moveFocused(-1);
      }
    }
    if (e.key === 'PageDown') {
      this.refs.items.moveFocused(13);
    }
    if (e.key === 'PageUp') {
      this.refs.items.moveFocused(-13);
    }
    if (e.key === 'Home') {
      this.refs.items.focusFirst();
    }
    if (e.key === 'End') {
      this.refs.items.focusLast();
    }
    if (e.key === 'Delete') {
      this.refs.items.closeFocused();
    }
    if (e.key === 'Enter') {
      this.refs.items.openFocused();
    }
    if (e.key === 'Escape') {
      if (this.state.filterText !== '') {
        this.setState({filterText: ''});
      }
      else {
        window.close();
      }
    }
    if (e.metaKey) {
      switch (e.keyCode) {
        // Meta+C
        case 67:
          this.refs.items.closeFocused();
          break;
        // Meta+B
        case 66:
          this.refs.items.bookmarkFocused();
          this.refs.items.closeFocused();
          break;
      }
    }
  },
  render: function() {
    return React.createElement('div', {}, [
      React.createElement('div', {key: 'input'},
        React.createElement(SearchBoxInput, {
          handleChange: this.filterTextChange,
          handleKeyDown: this.onKeyDown
        })
      ), [
          React.createElement(SearchResultItems, {
            items: this.props.items.filter(this.showItem),
            ref: 'items',
            key: 'items'
          }),
          React.createElement('span', {key: 'num_items'}, this.props.items.length)
        ]
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
    this.loadTabs();
  },
  // HACK: Sometimes chrome.tabs.query returns tabs we already called
  // chrome.tabs.remove on, even after the callback!
  // `withoutIDs` is an optional list of tab IDs that should be missing. If any
  // are present, loadTabs calls itself again in 50ms to sync up again.
  loadTabs: function(withoutIDs, callback) {
    callback = callback || function(){};
    chrome.tabs.query({}, function(tabs) {
      withoutIDs = withoutIDs || [];
      var res = tabs.filter(function(tab) { return withoutIDs.indexOf(tab.id) !== -1; });
      if (res.length !== 0) {
        setTimeout(this.loadTabs.bind(this, withoutIDs, callback), 50);
        return;
      }
      this.setState({
        items: tabs,
        loaded: true
      }, callback);
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

var TabMagicEl = React.createElement(TabMagic, {}, []);
TabMagicMain = React.render(TabMagicEl, document.getElementById('main_container'));
