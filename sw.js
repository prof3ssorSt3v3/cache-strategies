const version = 2;
const cacheName = `thatsWhatSheSaid${version}`;
const cacheList = ['./', './index.html', './favicon1.ico', './main.css', './404.html', './404.png', './main.js'];

self.addEventListener('install', (ev) => {
  //load the cacheList array into the cache
  ev.waitUntil(
    caches.open(cacheName).then((cache) => {
      cache.addAll(cacheList);
    }),
  );
});

self.addEventListener('activate', (ev) => {
  //delete old versions of the cache
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key != cacheName).map((nm) => caches.delete(nm)));
      //this only handles one cache name.
      // filter() needs modification if using multiple caches
    }),
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

  let destination = ev.request.destination; //destination property
  let isForHTML = destination == '' ? false : true; //request came from HTML element

  const isCSS = url.pathname.endsWith('.css') || url.hostname.includes('googleapis.com');
  const isHTMLPage = ev.request.mode === 'navigate';
  const isFont = url.hostname.includes('gstatic') || url.pathname.endsWith('woff2');

  const selfUrl = new URL(self.location);
  const isExternal = ev.request.mode == 'cors' || selfUrl.hostname !== url.hostname;

  if (isOnline) {
    ev.respondWith(networkRevalidateAndCache(ev));
  } else {
    ev.respondWith(cacheOnly(ev));
  }
});

async function cacheOnly(ev) {
  //only the response from the cache
  const cached = await caches.match(ev.request);
  return cached || new Response(null, { status: 404 });
}

async function cacheFirst(ev) {
  const cacheResponse = await caches.match(ev.request);
  if (cacheResponse) {
    return cacheResponse;
  }
  try {
    return await fetch(ev.request);
  } catch (err) {
    return new Response(null, { status: 404 });
  }
}

async function networkOnly(ev) {
  try {
    return await fetch(ev.request);
  } catch (err) {
    return new Response(null, { status: 504, statusText: 'Network error' });
  }
}

function networkFirst(ev) {
  //try fetch then cache
  return fetch(ev.request).then(async (response) => {
    if (response.status > 0 && !response.ok) {
      const cached = await caches.match(ev.request);
      return cached || new Response(null, { status: 404 });
    }
    return response;
  });
}

async function staleWhileRevalidate(ev, _cacheName = cacheName) {
  const cacheResponse = await caches.match(ev.request);

  const fetchPromise = fetch(ev.request)
    .then(async (response) => {
      if ((response && response.status === 0) || response.ok) {
        const cache = await caches.open(_cacheName);
        cache.put(ev.request, response.clone());
      }
      return response;
    })
    .catch(() => null); // swallow network errors

  return cacheResponse || (await fetchPromise) || new Response(null, { status: 404 });
}

async function networkFirstAndRevalidate(ev, _cacheName = cacheName) {
  try {
    const response = await fetch(ev.request);
    if (response.status > 0 && !response.ok) {
      const cached = await caches.match(ev.request);
      return cached || new Response(null, { status: 404 });
    }
    const cache = await caches.open(_cacheName);
    if (!ev.request.url.startsWith('chrome-extension')) {
      cache.put(ev.request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(ev.request);
    return cached || new Response(null, { status: 504, statusText: 'Network error' });
  }
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
