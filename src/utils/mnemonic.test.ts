import { describe, expect, it } from 'vitest'
import { renderMnemonic } from './mnemonic'

describe('renderMnemonic', () => {
  it('escapes raw HTML', () => {
    expect(renderMnemonic('<script>x</script>')).toBe('&lt;script&gt;x&lt;/script&gt;')
  })

  it('renders bold and italic', () => {
    expect(renderMnemonic('**hi** *yo*')).toBe('<strong>hi</strong> <em>yo</em>')
  })

  it('renders inline code', () => {
    expect(renderMnemonic('use `foo`')).toBe('use <code>foo</code>')
  })

  it('converts newlines to <br />', () => {
    expect(renderMnemonic('a\nb')).toBe('a<br />b')
  })

  it('escapes attributes inside fake tags', () => {
    expect(renderMnemonic('<img src="x" onerror="alert(1)">')).not.toContain('<img')
  })
})
