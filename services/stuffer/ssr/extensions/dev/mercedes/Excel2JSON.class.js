export default class Excel2JSON {
    constructor(workbook, sheetNames) {
        this.workbook = workbook
        this.sheetNames = sheetNames
        this.startingRow = 6
        this.tree = {}
    }

    start() {
        return new Promise((resolve, reject) => {
            this.sheetNames.forEach(item => {
                this.sheet = this.workbook.Sheets[item.name]
                if (!this.sheet) {
                    reject(new Error(`Sheet name ${item.name} does not exist`))
                    return;
                }
                if (item.startingRow) {
                    this.startingRow = item.startingRow
                }
                this.currentSheetName = item.name
                this.columnsToGet = item.columns
                this.getGroupNames()
                this.getStartAndEndRow()
            })
            resolve(this.tree)
        })
    }


    getGroupNames() {
        const { startingRow, sheet, currentSheetName: sheetName, tree } = this;
        const regex = /^([A])(\d+)$/
        const aColRows = Object.keys(sheet).filter(key => regex.test(key))

        let isGroupName = true;
        let lastWhiteSpace;
        const models = [];

        aColRows.forEach(row => {
            // Start from row 6
            if (regex.exec(row)[2] < startingRow) return
            if (!sheet[row] || sheet[row].t === 'z') {
                isGroupName = true;
                return;
            }
            if (isGroupName) {

                models.push({ title: sheet[row].w, path: row })
                isGroupName = false;
                !tree[sheetName] && (tree[sheetName] = {});
                tree[sheetName][sheet[row].w] = { title: sheet[row].w, path: row }
                return;
            }
        })

        lastWhiteSpace = aColRows.length + 1
        this.models = models
        this.lastWhiteSpace = lastWhiteSpace

    }

    getStartAndEndRow() {
        const { sheet, currentSheetName: sheetName, tree, models, lastWhiteSpace } = this;
        const regex = /\d+$/
        // Loop thorugh the keys and find the start and end row to search
        Object.keys(tree[sheetName]).forEach((key, index, arr) => {
            const startRow = parseInt(regex.exec(tree[sheetName][key].path)) + 1
            const nextKey = arr[index + 1];

            let endRow;
            if (!nextKey) {
                // If there is no nextKey it means we are at the final car model
                endRow = lastWhiteSpace - 1

            } else {
                endRow = parseInt(regex.exec(tree[sheetName][nextKey].path)) - 2
            }

            tree[sheetName][key].startRow = startRow
            tree[sheetName][key].endRow = endRow

            this.getCosts(key)
        })
    }

    getCosts(modelName) {
        const { sheet, currentSheetName: sheetName, tree, columnsToGet } = this;
        const model = tree[sheetName][modelName];

        for (let i = model.startRow; i <= model.endRow; i++) {
            // Loop through each model's rows
            // On every iteration loop thorugh the columns
            if (!sheet[`A${i}`]) {
                throw new Error('Could not find', `A${i}`)
            }
            const title = sheet[`A${i}`].w.trim()
            columnsToGet.forEach(item => {
                if (!model[title]) {
                    model[title] = {}
                }
                const cost = Math.round(sheet[`${item.col}${i}`].v)
                model[title][item.mileage] = cost
            })

        }
    }

}