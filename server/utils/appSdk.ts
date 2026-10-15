// server/utils/appSdk.ts
//
// The small piece of Afronet that lives inside every generated app.
//
// An app runs on an opaque origin with no storage of its own — that is what keeps one app out
// of another's data — so the only way it can keep anything is to ask the host. The host side
// of that conversation already existed; this is the side the app talks to.
//
// Written here rather than by the model, for three reasons:
//
//   It has to be exactly right. The message shape, the reply matching and the timeout are a
//   protocol, and a protocol written slightly differently in every app is a protocol that
//   works in most of them.
//
//   It is identical in every app, so it costs nothing to include and would cost output tokens
//   to have written each time.
//
//   It is injected before the package is stored, so the checksum covers it. What a device
//   verifies is the app and this together.
//
// The app sees one object, `afronet`, and never the postMessage underneath.

/** Long enough for a slow phone, short enough that a stuck call does not look like a hang. */
const REPLY_TIMEOUT_MS = 5000

/** How the SDK is recognised once it is in a document. Ours, not any `window.afronet`. */
const MARKER = '/* afronet-sdk v1 */'

const SDK = `<script>
${MARKER}
(function () {
  var pending = {};
  var nextId = 1;

  window.addEventListener('message', function (event) {
    var message = event.data;
    if (!message || message.afronet !== 1 || typeof message.id !== 'number') return;
    var waiting = pending[message.id];
    if (!waiting) return;
    delete pending[message.id];
    if (message.ok) waiting.resolve(message.result);
    else waiting.reject(new Error(message.error || 'Afronet refused that'));
  });

  function call(name, args) {
    return new Promise(function (resolve, reject) {
      var id = nextId++;
      pending[id] = { resolve: resolve, reject: reject };
      parent.postMessage({ afronet: 1, id: id, call: name, args: args }, '*');
      setTimeout(function () {
        if (!pending[id]) return;
        delete pending[id];
        reject(new Error('Afronet did not answer'));
      }, ${REPLY_TIMEOUT_MS});
    });
  }

  window.afronet = {
    storage: {
      get: function (key) { return call('storage.get', { key: String(key) }); },
      set: function (key, value) { return call('storage.set', { key: String(key), value: value }); }
    },
    toast: function (message) { return call('ui.toast', { message: String(message) }); }
  };

  parent.postMessage({ afronet: 1, event: 'ready' }, '*');
})();
<\/script>`

/**
 * Puts the SDK into a generated document, as the first thing in its head so it is defined
 * before any of the app's own code runs.
 *
 * Falls back to prepending it when there is no head to find, rather than returning a document
 * whose app would call something that does not exist.
 */
export function withSdk(html: string) {
    // Recognised by our own marker. Checking for `window.afronet` would let an app keep the
    // real bridge out simply by writing that name itself.
    if (html.includes(MARKER)) return html

    const head = html.match(/<head[^>]*>/i)
    if (head) {
        const at = (head.index ?? 0) + head[0].length
        return html.slice(0, at) + '\n' + SDK + html.slice(at)
    }

    return SDK + '\n' + html
}

/** What the model is told it can call. Kept beside the SDK so the two cannot describe different things. */
export const SDK_RULES = `Afronet gives the app one global, \`afronet\`, already defined before your code runs. Do not define it yourself.

  await afronet.storage.get(key)          -> the saved value, or null
  await afronet.storage.set(key, value)   -> saves any JSON-serialisable value
  await afronet.toast(message)            -> shows a short message in Afronet

This is the only way to keep anything. Use it for whatever the person would expect to still be there when they come back — entries they added, settings they chose, progress they made.

Load saved state once when the app starts, before the first render, and save again whenever it changes. Both calls return promises, so await them. Treat a rejection as "nothing saved" and carry on; never let a failed save break the app.

Limits: at most 20 keys, each key at most 64 characters, each value at most 64KB when serialised. Keep related data together under one key rather than spreading it across many.`
