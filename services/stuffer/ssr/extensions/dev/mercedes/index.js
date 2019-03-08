/**
 * TEST PROCESSOR
 */
import fs from 'fs-extra'
import archiver from 'archiver'
import { REGISTER_PROCESSORS } from 'features/postprocess/hooks'
const fileName = file => `${file.fileName}.json`
const exec = (origin, target, task) => new Promise(async (resolve, reject) => {
    console.log(origin)
    console.log(target)
    console.log(task)
    await fs.writeJSON(target, { "hoho": 123 })
    resolve()
    // const output = fs.createWriteStream(target)
    // const archive = archiver('zip', {
    //     zlib: {
    //         level: task.options.level || 9,
    //     },
    // })
    // output.on('close', () => resolve())
    // output.on('error', (err) => reject(err))
    // archive.pipe(output)
    // archive.append(fs.createReadStream(origin), {
    //     name: task.fileName,
    // })
    // archive.finalize()
})
export default ({ registerAction }) =>
    registerAction({
        hook: REGISTER_PROCESSORS,
        name: 'prc-mercedes-import',
        handler: ({ registerProcessor }) => registerProcessor({
            name: 'mercedes',
            fileName,
            exec,
        }),
    })