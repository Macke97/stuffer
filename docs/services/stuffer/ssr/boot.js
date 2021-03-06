import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import uuid from 'uuid/v1'
import * as config from '@marcopeg/utils/lib/config'
import { logInfo, logVerbose } from 'services/logger'
import {
    createHook,
    registerAction,
    createHookApp,
    logBoot,
    SETTINGS,
    FINISH,
} from '@marcopeg/hooks'

const services = [
    require('./services/env'),
    require('./services/logger'),
    require('./services/jwt'),
    require('./services/express'),
]

const features = [
    require('./features/authentication'),
    require('./features/upload'),
    require('./features/store'),
    require('./features/postprocess'),
    require('./features/download'),
]

const getJwtSecret = () => {
    const secret = config.get('JWT_SECRET', '---')
    if (secret !== '---') {
        return secret
    }

    const generatedSecret = uuid()
    logInfo('')
    logInfo('WARNING:')
    logInfo('Stuffer was started without a JWT_SECRET env var.')
    logInfo('The following value is being generated for this run:')
    logInfo(generatedSecret)
    logInfo('')
    return generatedSecret
}

registerAction({
    hook: SETTINGS,
    name: '♦ boot',
    handler: async ({ settings }) => {
        settings.stufferData = config.get('STUFFER_DATA', path.join(process.cwd(), 'data'))
        settings.stufferConfig = config.get('STUFFER_CONFIG', path.join(process.cwd(), 'stuffer-config.json'))

        // Read the .stuffrc in memory
        try {
            settings.stuffrc = await fs.readJSON(settings.stufferConfig)
        } catch (err) {
            logVerbose(`[config] could not read .stuffrc: ${settings.stufferConfig} - ${err.message}`)
            settings.stuffrc = {}
        }

        settings.jwt = {
            secret: getJwtSecret(),
            duration: config.get('JWT_DURATION', '0s'),
        }

        settings.express = {
            nodeEnv: config.get('NODE_ENV'),
            port: '8080',
        }

        settings.upload = {
            tempFolder: config.get('UPLOAD_DATA_PATH', path.join(settings.stufferData, 'uploads')),
            mountPoint: config.get('UPLOAD_MOUNT_POINT', '/upload'),
            publicSpace: config.get('UPLOAD_PUBLIC_SPACE', 'public'),
            bufferSize: Number(config.get('UPLOAD_BUFFER_SIZE', 2 * 1048576)), // Set 2MiB buffer
            maxSize: Number(config.get('UPLOAD_MAX_SIZE', 1000 * 1048576)), // 100Mb
            maxFiles: Number(config.get('UPLOAD_MAX_FILES', 10)),
            maxFields: Number(config.get('UPLOAD_MAX_FIELDS', 30)),
            maxFileSize: Number(config.get('UPLOAD_MAX_FILE_SIZE', 1000 * 1048576)), // 100Mb
            maxFieldSize: Number(config.get('UPLOAD_MAX_FIELD_SIZE', 5 * 1024)), // 5Kb - cookie style
        }
        
        settings.download = {
            baseUrl: config.get('DOWNLOAD_BASE_URL', 'http://localhost:8080'),
            mountPoint: config.get('DOWNLOAD_MOUNT_POINT', '/'),
        }
        
        settings.store = {
            base: config.get('STORE_DATA_PATH', path.join(settings.stufferData, 'store')),
        }

        settings.postprocess = {
            base: config.get('POSTPROCESS_DATA_PATH', path.join(settings.stufferData, 'postprocess')),
        }

        settings.auth = {
            isAnonymousUploadEnabled: config.get('AUTH_ENABLE_ANONYMOUS_UPLOAD', 'true') === 'true',
            isAnonymousDownloadEnabled: config.get('AUTH_ENABLE_ANONYMOUS_DOWNLOAD', 'true') === 'true',
            isCrossSpaceDownloadEnabled: config.get('AUTH_ENABLE_CROSS_SPACE_DOWNLOAD', 'false') === 'true',
        }

        // ---- EXTENSIONS

        // development extensions from a local folder
        // @NOTE: extensions should be plain NodeJS compatible, if you want to use
        // weird ES6 syntax you have to transpile your extension yourself
        const devExtensions = process.env.NODE_ENV === 'development'
            ? glob
                .sync(path.resolve(__dirname, 'extensions', 'dev', '[!_]*', 'index.js'))
            : []

        // community extensions from a mounted volume
        // @NOTE: extensions should be plain NodeJS compatible, if you want to use
        // weird ES6 syntax you have to transpile your extension yourself
        const communityExtensionsPath = config.get('COMMUNITY_EXTENSIONS', '/var/lib/stuffer/extensions')
        const communityExtensions = glob
            .sync(path.resolve(communityExtensionsPath, '[!_]*', 'index.js'))

        // core extensions, will be filtered by environment variable
        const rcExtensions = (settings.stuffrc.extensions || ['---']).filter(e => e.substr(0, 1) !== '#').join('|') || '---'
        const enabledExtensions = config.get('CORE_EXTENSIONS', rcExtensions)
        const coreExtensions = glob
            .sync(path.resolve(__dirname, 'extensions', 'core', `@(${enabledExtensions})`, 'index.js'))

        // register extensions
        const extensions = [ ...devExtensions, ...coreExtensions, ...communityExtensions ]
        for (const extensionPath of extensions) {
            const extension = require(extensionPath)
            const extensionHandler = extension.register || extension.default
            if (extensionHandler) {
                logInfo(`activate extension: ${extensionPath}`)
                await extensionHandler({
                    registerAction,
                    createHook,
                    settings: { ...settings },
                })
            }
        }
    },
})

registerAction({
    hook: FINISH,
    name: '♦ boot',
    handler: () => logBoot(),
})

export default createHookApp({
    settings: { cwd: process.cwd() },
    services,
    features,
})
