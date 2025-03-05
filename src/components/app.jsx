/* global alert */
import { useCallback, useMemo, useState } from 'react'
import b4a from 'b4a'
import debounce from 'debounceify'

import { createDriveWriter, createDriveReader } from '../lib/drive'

export default function App () {
  const [drive, setDrive] = useState()
  const [local, setLocal] = useState()

  const [inputCoreKey, setInputCoreKey] = useState('')
  const [status, setStatus] = useState('')

  const coreKey = drive ? b4a.toString(drive.key, 'hex') : ''

  const mirrorDrive = useCallback(async () => {
    console.log('mirroring up...', local, drive)
    if (!drive || !local) return
    const mirror = local.mirror(drive)
    await mirror.done()
    console.log('finished mirroring:', mirror.count)
  }, [drive, local])
  const mirror = useMemo(() => debounce(mirrorDrive), [mirrorDrive])

  const onStartWriter = async () => {
    const res = await createDriveWriter()
    setDrive(res.drive)
    setLocal(res.local)
  }

  const onStartReader = async () => {
    if (!inputCoreKey) {
      alert('Please enter a core key')
      return
    }
    setStatus('starting...')
    await createDriveReader({ coreKeyWriter: inputCoreKey })
    setStatus('started')
  }

  return (
    <div style={{ padding: 10, background: 'cyan' }}>
      <h1>MyApp</h1>

      <h2>Writer</h2>
      <button onClick={onStartWriter}>Start writer</button>
      <p>Core key: {coreKey}</p>
      <button onClick={() => mirror()}>Sync</button>

      <hr />

      <h2>Reader</h2>
      <div>
        <textarea type='text' value={inputCoreKey} onChange={(evt) => setInputCoreKey(evt.currentTarget.value)} />
      </div>
      <button onClick={onStartReader}>Start reader</button>
      <p>Status: {status}</p>
    </div>
  )
}
