// app/data/runtime.js
//
// The words the runtime needs: what each bridge call means, what the bridge will never do,
// and the messages shown when an app cannot be started.
//
// The list of calls an app may make is no longer written here — it comes from the package's
// own manifest, and the host enforces it. This file only says, in plain words, what each one
// means, so the settings panel can explain a manifest to the person holding the phone.

/** id -> how to describe it. Keys match the bridge calls in a package manifest. */
export const bridgeCallMeta = {
  'storage.get': {
    label: 'Read its own saved data',
    detail: 'Only the data this app wrote, in its own namespace.',
  },
  'storage.set': {
    label: 'Save data for itself',
    detail: 'Counts towards this app’s storage, and is deleted with it.',
  },
  'ui.toast': {
    label: 'Show a short message',
    detail: 'Plain text only, inside Afronet’s own notice.',
  },
  'net.fetch': {
    label: 'Call an approved address',
    detail: 'Only addresses declared in its manifest. Not available in this release.',
  },
}

/** What the bridge refuses, named so it can be checked rather than assumed. */
export const bridgeDenied = [
  'Your Afronet account, African ID or session',
  'Your wallet, cards or payment details',
  'Your chats, files, contacts or any other app’s data',
  'The network, except through an approved address',
  'Anything on the device that is not in the list above',
]

export const runtimeCopy = {
  sandboxTitle: 'Sandboxed',
  sandboxBody:
    'This app runs in a frame of its own, with no access to this page, your account or any other app. The browser enforces that, not just Afronet.',
  verifying: 'Verifying',
  notInstalled: {
    title: 'This app isn’t installed',
    body: 'Its files aren’t on this device — it may have been uninstalled, or the browser cleared it.',
  },
  unverified: {
    title: 'Purchase couldn’t be verified',
    body: 'Your entitlement for this paid app is missing or was refunded. Restoring purchases checks again with the server.',
  },
  noConnection: {
    title: 'Afronet Apps needs a connection',
    body: 'Apps run inside Afronet and check in with the server when they start. Using them offline comes in a later release.',
  },
}
