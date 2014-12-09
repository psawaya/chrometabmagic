'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.setBadgeText({text: '\'Allo'});

console.log('\'Allo \'Allo! Event Page for Browser Action');

function updateTabList() {
  chrome.tabs.query({}, function(tabs) {
    console.log(tabs);
  });
}

chrome.tabs.onCreated.addListener(updateTabList);
chrome.tabs.onUpdated.addListener(updateTabList);
chrome.tabs.onRemoved.addListener(updateTabList);
