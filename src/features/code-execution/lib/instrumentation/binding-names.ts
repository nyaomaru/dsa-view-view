import * as t from '@babel/types'

export const getUniqueNames = (names: string[]): string[] => [...new Set(names)]

export const collectBindingNames = (
  node: t.Node | null | undefined
): string[] => {
  if (!node) {
    return []
  }

  if (t.isIdentifier(node)) {
    return [node.name]
  }

  if (t.isRestElement(node)) {
    return collectBindingNames(node.argument)
  }

  if (t.isAssignmentPattern(node)) {
    return collectBindingNames(node.left)
  }

  if (t.isArrayPattern(node)) {
    return node.elements.flatMap((element) => collectBindingNames(element))
  }

  if (t.isObjectPattern(node)) {
    return node.properties.flatMap((property) => {
      if (t.isRestElement(property)) {
        return collectBindingNames(property.argument)
      }

      if (t.isObjectProperty(property)) {
        return collectBindingNames(property.value)
      }

      return []
    })
  }

  if (t.isTSParameterProperty(node)) {
    return collectBindingNames(node.parameter)
  }

  return []
}

export const getParameterNames = (
  params: Array<t.FunctionDeclaration['params'][number] | t.TSParameterProperty>
): string[] =>
  getUniqueNames(params.flatMap((param) => collectBindingNames(param)))
