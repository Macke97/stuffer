/**
 * Tries to load meta data for a specific file.
 * @TODO: keep an in-memory database of the meta data for faster access.
 */

import { createHook } from '@marcopeg/hooks'
import { DOWNLOAD_VALIDATE_META } from '../hooks'

export default options => ({
    name: 'validate-meta',
    priority: 200,
    handler: async (req, res, next) => {
        await createHook(DOWNLOAD_VALIDATE_META, {
            async: 'serie',
            args: {
                file: req.data.download,
            },
        })

        if (req.data.download.exists === false) {
            res.status(404).send('file not found')
            return
        }

        next()
    },
})
