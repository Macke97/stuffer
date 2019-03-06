/**
 * TEST PROCESSOR
 */

import fs from 'fs-extra'
import archiver from 'archiver'
import { REGISTER_PROCESSORS } from 'features/postprocess/hooks'

const fileName = file => `${file.fileName}.zip`

const exec = (origin, target, task) => new Promise((resolve, reject) => {
    const output = fs.createWriteStream(target)
    const archive = archiver('zip', {
        zlib: {
            level: task.options.level || 9,
        },
    })

    output.on('close', () => resolve())
    output.on('error', (err) => reject(err))

    archive.pipe(output)

    archive.append(fs.createReadStream(origin), {
        name: task.fileName,
    })
    archive.finalize()
})

export default ({ registerAction }) =>
    registerAction({
        hook: REGISTER_PROCESSORS,
        name: 'processor--gzip--extension',
        handler: ({ registerProcessor }) => registerProcessor({
            name: 'gzip',
            fileName,
            exec,
        }),
    })
