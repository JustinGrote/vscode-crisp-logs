// Inspired by: https://github.com/microsoft/TypeScript-TmLanguage/blob/master/build/build.ts

import { readFileSync, writeFileSync } from "fs"
import { load } from "js-yaml"

const basefile = 'log.tmLanguage'
type Variables = Record<string, string>
type Grammar = {
	variables?: Variables
}

// Replace {{variable}} with the variable content
function replaceVariables(content: string, variables: Variables): string {
	return content.toString().replace(/<<<\b([\w-]+?)>>>/g, (_, name) => {
		const value = variables[name]
		if (value === undefined) {
			throw new Error(`Unknown variable ${name}`)
		}
		console.log(`Replacing variable ${name} with ${value}`)
		return value
	})
}

const grammarYaml = readFileSync(`${basefile}.yaml`, { encoding: 'utf8' })
let grammar = load(grammarYaml) as Grammar

const variables = grammar.variables
if (variables) {
	grammar = load(replaceVariables(grammarYaml, variables)) as Grammar
}

delete grammar.variables
const grammarJson = JSON.stringify(grammar, undefined, 2)
writeFileSync(`${basefile}.json`, grammarJson)
console.log(`Output: ${basefile}.json`)
