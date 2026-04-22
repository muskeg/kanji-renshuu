/**
 * Lesson grouping (D.4).
 *
 * Every {@link LESSON_SIZE} kanji introduced is treated as a completed
 * "lesson" and awards a bonus XP checkpoint to keep the user motivated
 * through long stretches of new material.
 */

import { addXp } from '@/core/gamification/xp'
import { showToast } from '@/hooks/useToast'

export const LESSON_SIZE = 5
export const LESSON_BONUS_XP = 25
export const LESSON_CHECKPOINT_EVENT = 'kanji-renshuu-lesson-checkpoint'

export interface LessonCheckpointDetail {
  /** Total introduced kanji at the moment the checkpoint fired. */
  totalIntroduced: number
  /** Lesson number completed (1-indexed). */
  lessonNumber: number
  /** XP awarded for this checkpoint. */
  xpAwarded: number
}

/**
 * If `totalIntroducedAfter` lands on a lesson boundary, award the lesson
 * bonus XP and emit the checkpoint event so UI can react. No-op otherwise.
 *
 * Returns the awarded XP amount (0 if no checkpoint fired).
 */
export async function awardLessonBonusIfDue(totalIntroducedAfter: number): Promise<number> {
  if (totalIntroducedAfter <= 0) return 0
  if (totalIntroducedAfter % LESSON_SIZE !== 0) return 0
  await addXp(LESSON_BONUS_XP)
  if (typeof window !== 'undefined') {
    const detail: LessonCheckpointDetail = {
      totalIntroduced: totalIntroducedAfter,
      lessonNumber: totalIntroducedAfter / LESSON_SIZE,
      xpAwarded: LESSON_BONUS_XP,
    }
    window.dispatchEvent(new CustomEvent(LESSON_CHECKPOINT_EVENT, { detail }))
    showToast({
      title: `Lesson ${detail.lessonNumber} complete!`,
      body: `+${LESSON_BONUS_XP} XP bonus · ${totalIntroducedAfter} kanji introduced`,
      icon: '🎓',
    })
  }
  return LESSON_BONUS_XP
}
