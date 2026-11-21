import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  BankBundle,
  BankMeta,
  QuizMode,
  QuizResult,
  Question,
  SessionState,
} from '@/types/domain'
import { buildOrder, firstUnansweredIndex } from '@/core/quiz/selector'
import { judgeAnswer, scoreAnswer } from '@/core/quiz/judge'
import {
  saveProgress,
  saveSession,
  saveSessionNow,
} from '@/core/storage/records'
import { QUESTION_MAX_MS } from '@/core/constants'
import { clamp, newId } from '@/utils'
import { useBankStore } from './bank'
import { useFavoriteStore } from './favorite'
import { useSettingsStore } from './settings'
import { useStatsStore } from './stats'
import { useWrongStore } from './wrong'

export const useQuizStore = defineStore('quiz', () => {
  const session = ref<SessionState | null>(null)
  const meta = ref<BankMeta | null>(null)
  const question = ref<Question | null>(null)
  const feedback = ref<'none' | 'correct' | 'wrong'>('none')
  const picked = ref<string[]>([])
  const favoriteActive = ref(false)
  const loading = ref(false)
  const lastResult = ref<QuizResult | null>(null)

  let shownAt = 0
  let autoNextTimer: ReturnType<typeof setTimeout> | null = null

  function clearAutoNext(): void {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer)
      autoNextTimer = null
    }
  }

  const isExam = computed(() => session.value?.mode === 'exam')
  const isLast = computed(() => {
    if (!session.value) return false
    return session.value.index >= session.value.order.length - 1
  })
  const answerCount = computed(() => Object.keys(session.value?.answers ?? {}).length)
  const correctCount = computed(
    () => Object.values(session.value?.answers ?? {}).filter((answer) => answer.correct).length,
  )
  const progressPercent = computed(() => {
    if (!session.value || session.value.order.length === 0) return 0
    return Math.round(((session.value.index + 1) / session.value.order.length) * 100)
  })

  async function ensureBank(metaValue: BankMeta): Promise<BankBundle> {
    const bankStore = useBankStore()
    if (!bankStore.current || bankStore.current.meta.id !== metaValue.id) {
      const opened = await bankStore.open(metaValue.id)
      if (!opened) throw new Error('题库不可用，请返回重试')
      return opened
    }
    return bankStore.current
  }

  async function loadCurrent(): Promise<void> {
    if (!session.value) return
    const no = session.value.order[session.value.index]
    const loaded = await useBankStore().question(no)
    if (!loaded) throw new Error('题目加载失败，题库文件可能不完整')
    question.value = loaded
    const answer = session.value.answers[no]
    picked.value = answer ? [...answer.picked] : []
    feedback.value = answer ? (answer.correct ? 'correct' : 'wrong') : 'none'
    favoriteActive.value = useFavoriteStore().isFavorite(no)
    shownAt = Date.now()
  }

  async function start(
    metaValue: BankMeta,
    mode: QuizMode,
    options: { count?: number; chapter?: string } = {},
  ): Promise<void> {
    loading.value = true
    try {
      clearAutoNext()
      lastResult.value = null
      const bundle = await ensureBank(metaValue)
      meta.value = bundle.meta

      const wrongStore = useWrongStore()
      const favoriteStore = useFavoriteStore()
      wrongStore.load(meta.value)
      favoriteStore.load(meta.value)

      const settings = useSettingsStore()
      const allNos = Array.from({ length: meta.value.questionCount }, (_, index) => index + 1)
      const seed = Date.now()
      let order: number[] = []
      let startIndex = 0

      if (mode === 'sequence') {
        order = buildOrder('sequence', allNos)
        startIndex = firstUnansweredIndex(order, new Set(bundle.progress.seen))
      } else if (mode === 'random') {
        order = buildOrder('random', allNos, {
          count: options.count ?? 20,
          seed,
        })
      } else if (mode === 'wrong') {
        order = wrongStore.active.map((entry) => entry.no)
      } else if (mode === 'favorite') {
        order = favoriteStore.entries.map((entry) => entry.no)
      } else if (mode === 'exam') {
        order = buildOrder('exam', allNos, {
          count: settings.settings.examQuestionCount,
          seed,
        })
      } else {
        order = buildOrder('chapter', allNos, { pool: allNos })
      }

      if (!order.length) {
        throw new Error(
          mode === 'wrong'
            ? '错题本是空的，先去练习吧'
            : mode === 'favorite'
              ? '还没有收藏题目'
              : '题库中没有可练习的题目',
        )
      }
      order = order.filter(
        (no) => Number.isInteger(no) && no >= 1 && no <= meta.value!.questionCount,
      )
      if (!order.length) throw new Error('没有可练习的题目')

      const now = Date.now()
      session.value = {
        v: 1,
        id: newId('s'),
        bankId: meta.value.id,
        mode,
        order,
        index: Math.min(startIndex, order.length - 1),
        answers: {},
        startedAt: now,
        elapsedMs: 0,
        seed,
        chapter: options.chapter ?? null,
        exam:
          mode === 'exam'
            ? {
                durationSec: settings.settings.examDurationMin * 60,
                endsAt: now + settings.settings.examDurationMin * 60 * 1000,
                submittedAt: null,
                score: null,
              }
            : null,
        finishedAt: null,
      }
      saveSessionNow(session.value)
      await loadCurrent()
    } finally {
      loading.value = false
    }
  }

  async function resume(metaValue: BankMeta, bundle: BankBundle): Promise<boolean> {
    const stored = bundle.session
    if (!stored || stored.finishedAt) return false
    if (!Array.isArray(stored.order) || stored.order.length === 0) return false

    const valid = stored.order.every(
      (no) => Number.isInteger(no) && no >= 1 && no <= metaValue.questionCount,
    )
    if (!valid) return false

    loading.value = true
    try {
      await ensureBank(metaValue)
      meta.value = metaValue
      session.value = stored
      if (session.value.index < 0 || session.value.index >= session.value.order.length) {
        session.value.index = 0
      }
      useWrongStore().load(metaValue)
      useFavoriteStore().load(metaValue)
      lastResult.value = null
      await loadCurrent()
      return true
    } finally {
      loading.value = false
    }
  }

  function applyEffects(
    no: number,
    correct: boolean,
    pickedNow: string[],
    durationMs: number,
  ): void {
    const bankStore = useBankStore()
    if (bankStore.current && meta.value && bankStore.current.meta.id === meta.value.id) {
      const progress = bankStore.current.progress
      if (!progress.seen.includes(no)) progress.seen.push(no)
      progress.answered += 1
      if (correct) progress.correct += 1
      progress.lastNo = no
      progress.updatedAt = Date.now()
      saveProgress(bankStore.current.meta.id, progress)
    }

    if (meta.value) {
      useWrongStore().record(meta.value, no, correct, pickedNow)
    }
    useStatsStore().record(correct, durationMs)
  }

  async function submit(): Promise<void> {
    if (!session.value || !question.value) return
    if (!picked.value.length) return
    if (isExam.value && session.value.exam?.submittedAt) return
    if (!isExam.value && feedback.value !== 'none') return

    clearAutoNext()
    const current = question.value
    const pickedNow = [...picked.value].sort()
    const correct = judgeAnswer(current.type, pickedNow, current.answer)
    const durationMs = clamp(Date.now() - shownAt, 0, QUESTION_MAX_MS)

    session.value.answers[current.no] = {
      picked: pickedNow,
      correct,
      ms: durationMs,
      at: Date.now(),
    }
    session.value.elapsedMs += durationMs
    feedback.value = correct ? 'correct' : 'wrong'

    if (!isExam.value) {
      applyEffects(current.no, correct, pickedNow, durationMs)
    }

    saveSession(session.value)

    const settings = useSettingsStore()
    if (
      !isExam.value &&
      correct &&
      settings.settings.autoNext &&
      session.value.index < session.value.order.length - 1
    ) {
      const no = current.no
      autoNextTimer = setTimeout(() => {
        if (session.value?.answers[no]) void next()
      }, settings.settings.autoNextDelayMs)
    }
  }

  function saveExamAnswer(): void {
    if (!session.value || !question.value) return
    const current = question.value
    const pickedNow = [...picked.value].sort()
    session.value.answers[current.no] = {
      picked: pickedNow,
      correct: judgeAnswer(current.type, pickedNow, current.answer),
      ms: 0,
      at: Date.now(),
    }
    saveSession(session.value)
  }

  function select(key: string): void {
    if (!session.value || !question.value) return
    if (isExam.value) {
      if (session.value.exam?.submittedAt) return
      clearAutoNext()
      if (question.value.type === 'multiple') {
        picked.value = picked.value.includes(key)
          ? picked.value.filter((item) => item !== key)
          : [...picked.value, key]
      } else {
        picked.value = [key]
      }
      saveExamAnswer()
      return
    }

    if (feedback.value !== 'none') return

    clearAutoNext()
    if (question.value.type === 'multiple') {
      picked.value = picked.value.includes(key)
        ? picked.value.filter((item) => item !== key)
        : [...picked.value, key]
      return
    }
    picked.value = [key]
    void submit()
  }

  async function next(): Promise<void> {
    clearAutoNext()
    if (!session.value) return
    if (session.value.index >= session.value.order.length - 1) {
      await finish()
      return
    }
    session.value.index += 1
    saveSession(session.value)
    await loadCurrent()
  }

  async function prev(): Promise<void> {
    clearAutoNext()
    if (!session.value || session.value.index <= 0) return
    session.value.index -= 1
    saveSession(session.value)
    await loadCurrent()
  }

  async function jump(index: number): Promise<void> {
    clearAutoNext()
    if (!session.value) return
    const target = clamp(index, 0, session.value.order.length - 1)
    session.value.index = target
    saveSession(session.value)
    await loadCurrent()
  }

  function buildResult(exam: boolean): QuizResult {
    const current = session.value as SessionState
    const answers = Object.values(current.answers)
    const correct = answers.filter((answer) => answer.correct).length
    const answered = answers.length
    const wrongNos = exam
      ? current.order.filter((no) => !current.answers[no]?.correct)
      : current.order.filter((no) => current.answers[no] && !current.answers[no].correct)
    const durationMs =
      current.elapsedMs ||
      Math.max(0, (current.finishedAt ?? Date.now()) - current.startedAt)

    return {
      bankId: current.bankId,
      bankName: meta.value?.name ?? '题库',
      mode: current.mode,
      total: current.order.length,
      answered,
      correct,
      wrong: wrongNos.length,
      durationMs,
      wrongNos,
      score: exam ? (current.exam?.score ?? null) : null,
    }
  }

  async function submitExam(): Promise<QuizResult | null> {
    if (!session.value || !session.value.exam) return null
    if (session.value.exam.submittedAt) return lastResult.value

    clearAutoNext()
    const current = session.value
    const exam = current.exam
    if (!exam) return null
    const settings = useSettingsStore()
    const elapsedMs = Math.max(0, Date.now() - current.startedAt)
    current.elapsedMs = elapsedMs
    const answeredCount = Object.keys(current.answers).length
    const perAnswerMs = answeredCount ? Math.round(elapsedMs / answeredCount) : 0

    let scoreSum = 0
    for (const no of current.order) {
      const answer = current.answers[no]
      if (answer) {
        applyEffects(no, answer.correct, answer.picked, answer.ms || perAnswerMs)
        const loaded = await useBankStore().question(no)
        scoreSum += loaded
          ? scoreAnswer(
              loaded.type,
              answer.picked,
              loaded.answer,
              settings.settings.multiplePartialCredit,
            )
          : answer.correct
            ? 1
            : 0
      } else if (meta.value) {
        useWrongStore().record(meta.value, no, false, [])
      }
    }

    exam.submittedAt = Date.now()
    exam.score = Math.round((scoreSum / current.order.length) * 100)
    current.finishedAt = Date.now()

    saveSessionNow(current)
    lastResult.value = buildResult(true)
    return lastResult.value
  }

  async function finish(): Promise<QuizResult | null> {
    if (!session.value) return null
    if (isExam.value) return submitExam()

    clearAutoNext()
    session.value.finishedAt = Date.now()
    saveSessionNow(session.value)
    lastResult.value = buildResult(false)
    return lastResult.value
  }

  function toggleFavoriteCurrent(): void {
    if (!meta.value || !question.value) return
    favoriteActive.value = useFavoriteStore().toggle(meta.value, question.value.no)
  }

  function saveNow(): void {
    if (session.value) saveSessionNow(session.value)
  }

  function stopAutoNext(): void {
    clearAutoNext()
  }

  function reset(): void {
    clearAutoNext()
    session.value = null
    meta.value = null
    question.value = null
    feedback.value = 'none'
    picked.value = []
    favoriteActive.value = false
    lastResult.value = null
  }

  return {
    session,
    meta,
    question,
    feedback,
    picked,
    favoriteActive,
    loading,
    lastResult,
    isExam,
    isLast,
    answerCount,
    correctCount,
    progressPercent,
    start,
    resume,
    select,
    submit,
    next,
    prev,
    jump,
    finish,
    submitExam,
    toggleFavoriteCurrent,
    saveNow,
    stopAutoNext,
    reset,
  }
})
