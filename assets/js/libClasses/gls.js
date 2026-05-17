import { readSettings } from "../global.js"

export class _GLS {
    constructor(languageJSON) {
        this.languageJSON = languageJSON
    }

    static async init(language) {
        const settings = await readSettings()
        const allLanguages = await window.electron.getAllLanguagesJSON()

        const lang = language == undefined ? settings?.app?.language : language
        const languageJSON = allLanguages?.[lang]

        return new _GLS(languageJSON || null)
    }

    get(path, replacements, depth = 0) {
        if (depth > 10) return path;

        const parts = path.split('.');
        let current = this.languageJSON;

        for (let i = 0; i < parts.length; i++) {
            if (current == null) return path;
            current = current[parts[i]];

            if (current === undefined) return path;
        }

        const regex = /\{\{([^{}]+)\}\}/g;

        current = String(current);

        current = current.replace(regex, (full, key) => {
            const val = this.get(key, undefined, depth + 1);
            return val === undefined ? full : val;
        });

        if (typeof replacements === "object" && !Array.isArray(replacements)) {
            Object.keys(replacements).forEach(r => {
                current = String(current).replaceAll(`%{${r}}`, replacements[r]);
            });
        }

        return current;
    }
}