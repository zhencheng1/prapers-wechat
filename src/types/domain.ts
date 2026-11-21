export type QuestionType = 'single' | 'multiple' | 'judge'
export type QuizMode = 'sequence' | 'random' | 'chapter' | 'wrong' | 'favorite' | 'exam'
export type BankSource = 'json' | 'pdf' | 'demo' | 'manual'
export type StorageMode = 'file' | 'storage'
export type BankStatus = 'ready' | 'missing' | 'corrupted'
export type AnalysisMode = 'always' | 'wrong' | 'never'
export type FontSize = 'sm' | 'md' | 'lg'

export interface QuestionOption {
  key: string
  text: string
}

export interface Question {
  no: number
  type: QuestionType
  stem: string
  options: QuestionOption[]
  answer: string[]
  analysis: string
  chapter: string
  tags: string[]
  difficulty: number
  images: string[]
}

export interface ChunkRef {
  index: number
  from: number
  to: number
  ref: string
  size: number
}

export interface BankMeta {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  source: BankSource
  status: BankStatus
  storageMode: StorageMode
  questionCount: number
  sizeBytes: number
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
  schemaVersion: number
}

export interface BankManifest {
  v: 1
  bankId: string
  questionCount: number
  chunkSize: number
  chunks: ChunkRef[]
  checksum: string
  createdAt: number
}

export interface BankChunk {
  v: 1
  bankId: string
  from: number
  to: number
  questions: Question[]
}

export interface Progress {
  v: 1
  lastNo: number
  seen: number[]
  answered: number
  correct: number
  updatedAt: number
}

export interface WrongEntry {
  no: number
  wrongCount: number
  streak: number
  lastWrongAt: number
  lastPicked: string[]
  masteredAt: number | null
}

export interface FavoriteEntry {
  no: number
  createdAt: number
}

export interface SessionAnswer {
  picked: string[]
  correct: boolean
  ms: number
  at: number
}

export interface ExamState {
  durationSec: number
  endsAt: number
  submittedAt: number | null
  score: number | null
}

export interface SessionState {
  v: 1
  id: string
  bankId: string
  mode: QuizMode
  order: number[]
  index: number
  answers: Record<number, SessionAnswer>
  startedAt: number
  elapsedMs: number
  seed: number
  chapter: string | null
  exam: ExamState | null
  finishedAt: number | null
}

export interface Attempt {
  ts: number
  no: number
  picked: string[]
  correct: boolean
  ms: number
  mode: QuizMode
}

export interface DailyStat {
  date: string
  answered: number
  correct: number
  durationMs: number
  sessions: number
}

export type DailyStats = Record<string, DailyStat>

export interface Settings {
  v: 1
  showAnalysis: AnalysisMode
  autoNext: boolean
  autoNextDelayMs: number
  wrongMasterStreak: number
  multiplePartialCredit: boolean
  shuffleOptions: boolean
  fontSize: FontSize
  theme: 'light' | 'dark' | 'system'
  examDurationMin: number
  examQuestionCount: number
  dailyGoal: number
}

export interface AppMeta {
  v: 1
  installId: string
  schemaVersion: number
  createdAt: number
  lastBackupAt: number
  lastActiveDate: string
  streak: number
  demoSeeded: boolean
}

export interface BankBundle {
  meta: BankMeta
  manifest: BankManifest
  progress: Progress
  wrong: WrongEntry[]
  favorites: FavoriteEntry[]
  session: SessionState | null
}

export interface ImportIssue {
  level: 'error' | 'warning'
  path: string
  message: string
}

export interface DraftBank {
  meta: {
    name: string
    description: string
    category: string
    tags: string[]
  }
  questions: Question[]
  issues: ImportIssue[]
  duplicates: number
}

export interface QuizResult {
  bankId: string
  bankName: string
  mode: QuizMode
  total: number
  answered: number
  correct: number
  wrong: number
  durationMs: number
  wrongNos: number[]
  score: number | null
  finishedAt: number
}

export interface BackupBank {
  meta: BankMeta
  questions: Question[]
  progress: Progress
  wrong: WrongEntry[]
  favorites: FavoriteEntry[]
  session: SessionState | null
}

export interface BackupData {
  schema: 'quizbackup/v1'
  exportedAt: number
  app: {
    installId: string
    schemaVersion: number
  }
  banks: BackupBank[]
  stats: DailyStats
  settings: Settings
}
