import { useMemo } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import { useKanjiData } from '@/hooks/useKanjiData'
import { useTranslation, getMeanings } from '@/i18n'
import styles from './ComponentGraph.module.css'

interface ComponentGraphProps {
  kanji: KanjiEntry
  /** Optional click handler to navigate to a component kanji's detail. */
  onPickComponent?: (literal: string) => void
}

interface Node {
  literal: string
  meaning: string
  children: Node[]
}

/**
 * Two-level component decomposition:
 *   root (the kanji) → its `components` → each component's components
 *
 * Components found in the loaded Jōyō dataset render with a meaning gloss
 * and become clickable; unknown components (often radicals not in Jōyō)
 * render greyed-out and inert.
 */
export function ComponentGraph({ kanji, onPickComponent }: ComponentGraphProps) {
  const { t } = useTranslation()
  const { kanji: allKanji } = useKanjiData()

  const lookup = useMemo(() => {
    const map = new Map<string, KanjiEntry>()
    for (const k of allKanji) map.set(k.literal, k)
    return map
  }, [allKanji])

  const tree = useMemo<Node>(() => {
    function build(literal: string, depth: number): Node {
      const entry = lookup.get(literal)
      const meaning = entry ? getMeanings(entry).slice(0, 2).join(', ') : ''
      const childLiterals = entry && depth < 2 ? entry.components.filter(c => c !== literal) : []
      const children = childLiterals.map(c => build(c, depth + 1))
      return { literal, meaning, children }
    }
    return build(kanji.literal, 0)
  }, [kanji, lookup])

  if (tree.children.length === 0) return null

  return (
    <div className={styles.container} aria-label={t('detail.componentTree')}>
      <NodeView node={tree} root onPick={onPickComponent} />
    </div>
  )
}

interface NodeViewProps {
  node: Node
  root?: boolean
  onPick?: (literal: string) => void
}

function NodeView({ node, root = false, onPick }: NodeViewProps) {
  const known = node.meaning.length > 0
  const Tag = onPick && known && !root ? 'button' : 'div'
  return (
    <div className={styles.nodeWrap}>
      <Tag
        type={Tag === 'button' ? 'button' : undefined}
        className={`${styles.node} ${root ? styles.root : ''} ${known ? '' : styles.unknown}`}
        onClick={Tag === 'button' && onPick ? () => onPick(node.literal) : undefined}
      >
        <span className={styles.literal}>{node.literal}</span>
        {known && <span className={styles.meaning}>{node.meaning}</span>}
      </Tag>
      {node.children.length > 0 && (
        <ul className={styles.children}>
          {node.children.map((child, i) => (
            <li key={`${child.literal}-${i}`}>
              <NodeView node={child} onPick={onPick} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
