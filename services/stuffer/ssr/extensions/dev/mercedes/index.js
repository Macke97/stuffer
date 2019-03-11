/**
 * TEST PROCESSOR
 */
import fs from 'fs-extra'
import archiver from 'archiver'
import xlsx from 'xlsx'
import Excel2JSON from './Excel2JSON.class'
import { twentyFour, thirtySix, fourtyEight, sixty } from './worksheets'
import { REGISTER_PROCESSORS } from 'features/postprocess/hooks'
const fileName = file => `${file.fileName}.json`
const exec = (origin, target, task) => new Promise(async (resolve, reject) => {
    const workbook = xlsx.readFile(origin, { sheetStubs: true });
    const excel2JSON = new Excel2JSON(workbook, [twentyFour, thirtySix, fourtyEight, sixty])
    let data;
    try {
        data = await excel2JSON.start()
    } catch (error) {
        console.error("\x1b[31m", error.message)
        reject()
    }
    await fs.writeJSON(target, data)

    resolve()

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