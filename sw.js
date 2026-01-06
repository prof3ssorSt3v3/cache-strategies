const version = 2;
const cacheName = `thatsWhatSheSaid${version}`;
const cacheList = ['./', './index.html', './favicon.ico', './main.css', './404.html', './404.png', './main.js'];

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
  const isOnline = self.navigator.onLine;
  console.warn({ isOnline });

  const url = new URL(ev.request.url);
  const isImage = url.hostname.includes('picsum.photos') || url.pathname.includes('.png') || url.pathname.endsWith('.jpg');

  const isJSON = url.hostname.includes('random-data-api.com');

  const isCSS = url.pathname.endsWith('.css') || url.hostname.includes('googleapis.com');
  const isHTML = ev.request.mode === 'navigate';
  const isFont = url.hostname.includes('gstatic') || url.pathname.endsWith('woff2');

  const selfUrl = new URL(self.location);
  const isExternal = ev.request.mode == 'cors' || selfUrl.hostname !== url.hostname;

  if (isOnline) {
    ev.respondWith(networkRevalidateAndCache(ev));
  } else {
    ev.respondWith(cacheOnly(ev));
  }
});

function cacheOnly(ev) {
  //only return what is in the cache
  return caches.match(ev.request);
}
function cacheFirst(ev) {
  //return from cache or fetch if not in cache
  return caches.match(ev.request).then((cacheResponse) => {
    //return cacheResponse if not null
    return cacheResponse || fetch(ev.request);
  });
}
function networkOnly(ev) {
  //only return fetch response
  return fetch(ev.request);
}
function networkFirst(ev) {
  //try fetch and fallback on cache
  return fetch(ev.request).then((fetchResponse) => {
    if (fetchResponse.ok) return fetchResponse;
    return caches.match(ev.request);
  });
}
function staleWhileRevalidate(ev) {
  //check cache and fallback on fetch for response
  //always attempt to fetch a new copy and update the cache
  return caches.match(ev.request).then((cacheResponse) => {
    let fetchResponse = fetch(ev.request).then((response) => {
      return caches.open(cacheName).then((cache) => {
        cache.put(ev.request, response.clone());
        return response;
      });
    });
    return cacheResponse || fetchResponse;
  });
}
function networkRevalidateAndCache(ev) {
  //try fetch first and fallback on cache
  //update cache if fetch was successful
  return fetch(ev.request, { mode: 'cors', credentials: 'omit' }).then((fetchResponse) => {
    if (fetchResponse.ok) {
      //put in cache
      return caches.open(cacheName).then((cache) => {
        cache.put(ev.request, fetchResponse.clone());
        return fetchResponse;
      });
    } else {
      return caches.match(ev.request);
    }
  });
}
function placeholderImage(ev) {
  //return a specific placeholder image from the cache
  return caches.match('./404.png');
}
function Html404(ev) {
  //return a 404 html file from the cache
  return caches.match('./404.html');
}
function fakeServerError(ev) {
  //pretend to have a server-side error
  return new Response('<html><body><h1>Server Gone Crazy</h1></body></html>', {
    status: 555,
    statusText: 'Server Gone Crazy',
    headers: {
      'content-type': 'text/html',
    },
  });
}
function blahblahblah(ev) {
  //invent your own strategy to deal with a specific circumstance in your app
}
