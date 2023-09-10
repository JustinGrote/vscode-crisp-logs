// Inspired by: https://github.com/microsoft/TypeScript-TmLanguage/blob/master/build/build.ts

import { readFileSync, writeFileSync } from "fs"
import { load } from "js-yaml"

const basefile = 'log.tmLanguage'
type Variables = Record<string, string>
type Resolvers = Map<string, string>
type Grammar = {
	variables?: Variables
}
const tokenBegin = '\\$\\{'
const tokenEnd = '\\}'

/** Recursively resolves all variable values that may reference each other */
function resolveVariables(variables: Variables) {
	// If a variable contains a substitution, replace it with that substitution
	const resolved: Resolvers = new Map()
	const resolving: Resolvers = new Map()

	Object.entries(variables).forEach(([name, template]) => {
		if (!template.match(tokenBegin)) {
			console.log(`RESOLVER: ${name} will resolve to ${template}`)
			resolved.set(name, template)
		} else {
			resolving.set(name, template)
		}
	})

	while (resolving.size > 0) {
		let newResolverDetected = false
		resolving.forEach((template, name) => {
			const resolvedTemplate = replaceVariables(template, resolved)
			if (resolvedTemplate.match(tokenBegin)) {
				// We still have unresolved variables for this entry, we will try again on the next loop
				return
			}
			newResolverDetected = true
			console.log(`RESOLVER: ${name} will resolve to ${resolvedTemplate}`)
			resolved.set(name, resolvedTemplate)
			resolving.delete(name)
		})

		if (!newResolverDetected) {
			throw new Error(`Either these strings have variables that are not defined, or a circular reference exists: ${JSON.stringify(resolving)}`)
		}
	}

	return resolved
}

function replaceVariables(content: string, resolvers: Resolvers): string {
	const substitutionRegex = `${tokenBegin}\\b([\\w-]+?)${tokenEnd}`
	return content.toString().replaceAll(new RegExp(substitutionRegex, "g"), (match, name) => {
		const resolvedValue = resolvers.get(name)
		// If the variable is not defined, leave it as-is
		if (!resolvedValue) { return match }
		console.log(`Replacing variable ${name} with ${resolvedValue}`)
		return resolvedValue
	})
}

const grammarYaml = readFileSync(`${basefile}.yaml`, { encoding: 'utf8' })
let grammar = load(grammarYaml) as Grammar

const variables = grammar.variables
if (variables) {
	grammar = load(replaceVariables(grammarYaml, resolveVariables(variables))) as Grammar
}

delete grammar.variables
const grammarJson = JSON.stringify(grammar, undefined, 2)
writeFileSync(`${basefile}.json`, grammarJson)
console.log(`Output: ${basefile}.json`)
