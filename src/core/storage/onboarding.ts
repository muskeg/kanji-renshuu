const ONBOARDED_KEY = 'kanji-renshuu-onboarded'

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === '1'
}

export function markOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, '1')
}
