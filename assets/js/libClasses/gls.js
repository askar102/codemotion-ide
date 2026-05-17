import { readSettings } from "../global.js"

export class _GLS {
    constructor(languageJSON) {
        this.languageJSON = languageJSON
    }

    static async init() {
        const settings = await readSettings()
        const allLanguages = await window.electron.getAllLanguagesJSON()

        const lang = settings?.app?.language
        const languageJSON = allLanguages?.[lang]

        return new _GLS(languageJSON || null)
    }

    get(path, replacements) {
        const parts = path.split('.')
        let current = this.languageJSON

        for (let i = 0; i < parts.length; i++) {
            if (current == null) return path
            current = current[parts[i]]

            if (current === undefined) return path
        }

        if(typeof replacements == "object" && !Array.isArray(replacements)) {
            Object.keys(replacements).forEach(r => {
                current = current.replaceAll(`%{${r}}`, replacements[r])
            })
        }

        return current
    }
}