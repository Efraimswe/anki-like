import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  parse,
  TYPE,
  type MessageFormatElement,
  type PluralElement,
  type SelectElement,
  type TagElement,
} from '@formatjs/icu-messageformat-parser';
import ts from 'typescript';

const MESSAGES_DIR = join(__dirname, '../../messages');
const { ScriptTarget, ScriptKind } = ts;

export function loadLocale(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf-8'));
}

export function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

function isPluralOrSelect(el: MessageFormatElement): el is PluralElement | SelectElement {
  return el.type === TYPE.plural || el.type === TYPE.select;
}

function isTag(el: MessageFormatElement): el is TagElement {
  return el.type === TYPE.tag;
}

function collectPlaceholders(elements: MessageFormatElement[], names: Set<string>): void {
  for (const el of elements) {
    if (el.type === TYPE.argument) {
      names.add(el.value);
    } else if (isPluralOrSelect(el)) {
      names.add(el.value);
      for (const branch of Object.values(el.options)) {
        collectPlaceholders(branch.value, names);
      }
    } else if (isTag(el)) {
      collectPlaceholders(el.children, names);
    }
  }
}

export function extractPlaceholders(icuMessage: string): Set<string> {
  const ast = parse(icuMessage, { ignoreTag: false });
  const names = new Set<string>();
  collectPlaceholders(ast, names);
  return names;
}

export function extractPluralBranches(icuMessage: string): Map<string, Set<string>> {
  const ast = parse(icuMessage, { ignoreTag: false });
  const result = new Map<string, Set<string>>();
  function walk(elements: MessageFormatElement[]): void {
    for (const el of elements) {
      if (isPluralOrSelect(el)) {
        result.set(el.value, new Set(Object.keys(el.options)));
        for (const branch of Object.values(el.options)) {
          walk(branch.value);
        }
      } else if (isTag(el)) {
        walk(el.children);
      }
    }
  }
  walk(ast);
  return result;
}

interface UsageRecord {
  file: string;
  namespace: string;
  keys: string[];
  hasDynamic: boolean;
  overrides: string[];
}

function getStringLiteral(node: ts.Node): string | null {
  return ts.isStringLiteral(node) ? node.text : null;
}

function parseOverrideComment(text: string): string[] {
  const match = text.match(/i18n-keys:\s*(\[.*?\])/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function getLeadingCommentOverrides(node: ts.Node, sourceFile: ts.SourceFile): string[] {
  // Leading comments before `const t = ...` are trivia on the VariableStatement,
  // not the VariableDeclaration. Resolve to the containing statement.
  const target = ts.findAncestor(node, ts.isVariableStatement) ?? node;
  const fullText = sourceFile.getFullText();
  const commentRanges = ts.getLeadingCommentRanges(fullText, target.getFullStart()) ?? [];
  const overrides: string[] = [];
  for (const range of commentRanges) {
    overrides.push(...parseOverrideComment(fullText.slice(range.pos, range.end)));
  }
  return overrides;
}

export function scanSourceFiles(srcDir: string): UsageRecord[] {
  const results: UsageRecord[] = [];

  function getAllFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath));
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  for (const filePath of getAllFiles(srcDir)) {
    const source = readFileSync(filePath, 'utf-8');
    const sf = ts.createSourceFile(filePath, source, ScriptTarget.Latest, true, ScriptKind.TSX);

    const bindings = new Map<string, { namespace: string; keys: string[]; hasDynamic: boolean; overrides: string[] }>();

    function visitForHooks(node: ts.Node): void {
      if (ts.isVariableDeclaration(node)) {
        const init = node.initializer;
        let callNode: ts.CallExpression | null = null;
        if (init && ts.isCallExpression(init)) {
          callNode = init;
        } else if (init && ts.isAwaitExpression(init) && ts.isCallExpression(init.expression)) {
          callNode = init.expression;
        }
        if (callNode) {
          const calleeName = ts.isIdentifier(callNode.expression) ? callNode.expression.text : null;
          if (calleeName === 'useTranslations' || calleeName === 'getTranslations') {
            const bindingName = ts.isIdentifier(node.name) ? node.name.text : null;
            if (bindingName) {
              const nsArg = callNode.arguments[0];
              const ns = nsArg ? getStringLiteral(nsArg) : null;
              const overrides = getLeadingCommentOverrides(node, sf);
              bindings.set(bindingName, {
                namespace: ns ?? '__dynamic__',
                keys: [],
                hasDynamic: !ns,
                overrides,
              });
            }
          }
        }
      }
      ts.forEachChild(node, visitForHooks);
    }

    visitForHooks(sf);

    function visitForCalls(node: ts.Node): void {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        const binding = bindings.get(name);
        if (binding && binding.namespace !== '__dynamic__') {
          const keyArg = node.arguments[0];
          if (keyArg) {
            const literal = getStringLiteral(keyArg);
            if (literal) {
              binding.keys.push(`${binding.namespace}.${literal}`);
            } else {
              binding.hasDynamic = true;
            }
          }
        }
      }
      ts.forEachChild(node, visitForCalls);
    }

    visitForCalls(sf);

    for (const [, record] of bindings) {
      if (record.namespace === '__dynamic__') continue;
      results.push({
        file: filePath,
        namespace: record.namespace,
        keys: record.keys,
        hasDynamic: record.hasDynamic,
        overrides: record.overrides,
      });
    }
  }

  return results;
}
