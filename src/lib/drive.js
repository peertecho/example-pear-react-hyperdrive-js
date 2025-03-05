/* global Pear, Node */
/** @typedef {import('pear-interface')} */

import path from 'path'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperdrive from 'hyperdrive'
import Localdrive from 'localdrive'
import debounce from 'debounceify'

const { updates, reload, teardown } = Pear

updates(() => reload())

const swarm = new Hyperswarm()
teardown(() => swarm.destroy())

export async function createDriveWriter ({ name = 'writer' } = {}) {
  console.log('starting writer')
  const store = new Corestore(path.join(Pear.config.storage, name))
  await store.ready()
  swarm.on('connection', conn => store.replicate(conn))

  const drive = new Hyperdrive(store)
  await drive.ready()

  const local = new Localdrive('../writer-dir')

  const discovery = swarm.join(drive.discoveryKey)
  await discovery.flushed()

  return { drive, local }
}

export async function createDriveReader ({ name = 'reader', coreKeyWriter } = {}) {
  console.log('starting reader', coreKeyWriter)
  const store = new Corestore(path.join(Pear.config.storage, name))
  await store.ready()
  swarm.on('connection', (conn) => store.replicate(conn))

  const drive = new Hyperdrive(store, coreKeyWriter)
  await drive.ready()

  const local = new Localdrive('../reader-dir')

  async function mirrorDrive () {
    console.log('mirroring down...')
    const mirror = drive.mirror(local)
    await mirror.done()
    console.log('finished mirroring:', mirror.count)
  }
  const mirror = debounce(mirrorDrive)

  drive.core.on('append', mirror)

  const foundPeers = store.findingPeers()
  swarm.join(drive.discoveryKey, { client: true, server: false })
  swarm.flush().then(() => foundPeers())

  mirror()
}
