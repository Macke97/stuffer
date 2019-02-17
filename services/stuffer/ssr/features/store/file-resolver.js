/**
 * Storage local file resolver.
 *
 * NOTE: I read on Node's doc that is not a good idea to use fs.stats()
 * or similar to test for the file to exists.
 *
 * This step will only provide the necessary info for the streamer to
 * try to read and stream out the file.
 */

export default ({ file, base }) => {
    file.filePath = [
        base,
        'files',
        file.space,
        file.uuid,
        file.name,
    ].join('/')
}