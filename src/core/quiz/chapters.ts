import type { Question } from '@/types/domain'

/** 没有填写章节的题目统一归入该分组。 */
export const UNCHAPTERED = '未分章节'

export function chapterName(question: Question): string {
  const value = typeof question.chapter === 'string' ? question.chapter.trim() : ''
  return value || UNCHAPTERED
}

export interface ChapterGroup {
  name: string
  count: number
  nos: number[]
}

/** 按章节分组，组内题号按题目顺序排列，组间按首次出现的顺序排列。 */
export function groupByChapter(questions: Question[]): ChapterGroup[] {
  const groups = new Map<string, ChapterGroup>()
  const sorted = [...questions].sort((left, right) => left.no - right.no)
  for (const question of sorted) {
    const name = chapterName(question)
    let group = groups.get(name)
    if (!group) {
      group = { name, count: 0, nos: [] }
      groups.set(name, group)
    }
    group.nos.push(question.no)
    group.count += 1
  }
  return [...groups.values()]
}

/** 取指定章节的题号列表；章节不存在时返回空数组。 */
export function nosOfChapter(questions: Question[], chapter: string): number[] {
  return groupByChapter(questions).find((group) => group.name === chapter)?.nos ?? []
}
