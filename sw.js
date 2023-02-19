const version = 1;
const cacheName = `thatsWhatSheSaid${version}`;
const cacheList = ['./', './index.html', './main.css', './404.html', './404.png', './main.js', './favicon1.ico'];

self.addEventListener('install', (ev) => {
  //load the cacheList array into the cache
  ev.waitUntil(
    caches.open(cacheName).then((cache) => {
      cache.addAll(cacheList);
    })
  );
});

self.addEventListener('activate', (ev) => {
  //delete old versions of the cache
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key != cacheName).map((nm) => caches.delete(nm)));
    })
  );
});

self.addEventListener('fetch', (ev) => {
  //handle fetch requests
  //online? external? font? css? img? html? specific folder?
});

function cacheOnly(ev) {
  //only return what is in the cache
}
function cacheFirst(ev) {
  //return from cache or fetch if not in cache
}
function networkOnly(ev) {
  //only return fetch response
}
function networkFirst(ev) {
  //try fetch and fallback on cache
}
function staleWhileRevalidate(ev) {
  //check cache and fallback on fetch for response
  //always attempt to fetch a new copy and update the cache
}
function networkRevalidateAndCache(ev) {
  //try fetch first and fallback on cache
  //update cache if fetch was successful
}
function placeholderImage(ev) {
  //return a specific placeholder image from the cache
}
function Html404(ev) {
  //return a 404 html file from the cache
}
function fakeServerError(ev) {
  //pretend to have a server-side error
}
function blahblahblah(ev) {
  //invent your own strategy to deal with a specific circumstance in your app
}
