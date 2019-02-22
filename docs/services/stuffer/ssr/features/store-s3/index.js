import { INIT_FEATURE, START_FEATURE } from '@marcopeg/hooks'
import { STORE_CHANGE_RESOLVER, STORE_FILE_MOVED } from 'ssr/features/store/hooks'
import { FEATURE_NAME } from './hooks'

// import * as lru from './lru-cache'
// import downloadCacheCheckMiddleware from './download-cache-check.middleware'
// import downloadCacheWriteMiddleware from './download-cache-write.middleware'
import initHandler from './init/init.handler'
import { start as startUploadPool } from './upload/pool'
import cacheResolver from './cache-resolver'
import uploadFile from './upload/file'

export const register = ({ registerAction, settings }) => {
    registerAction({
        hook: INIT_FEATURE,
        name: FEATURE_NAME,
        trace: __filename,
        handler: () => initHandler(settings),
    })

    registerAction({
        hook: START_FEATURE,
        name: FEATURE_NAME,
        trace: __filename,
        handler: startUploadPool,
    })

    registerAction({
        hook: STORE_FILE_MOVED,
        name: FEATURE_NAME,
        trace: __filename,
        handler: uploadFile,
    })

    registerAction({
        hook: STORE_CHANGE_RESOLVER,
        name: FEATURE_NAME,
        trace: __filename,
        handler: cacheResolver(settings),
    })
}