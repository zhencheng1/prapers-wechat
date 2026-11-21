<template>
  <view class="page">
    <view class="card intro">
      <text class="title">导入题库</text>
      <text class="small muted intro-text">
        纯本地导入，题目只保存在这台设备上。推荐使用 quizbank/v1 格式的 JSON 文件。
      </text>
    </view>

    <view class="step-card card press" @tap="chooseJson">
      <view class="row between">
        <view class="grow">
          <text class="step-title">选择 JSON 文件</text>
          <text class="small muted step-desc">
            微信中请先把文件发送到「文件传输助手」或聊天，再从聊天文件中选择。
          </text>
        </view>
        <text class="step-arrow">›</text>
      </view>
    </view>

    <view class="step-card card press" @tap="goPdf">
      <view class="row between">
        <view class="grow">
          <text class="step-title">PDF 导入（P1）</text>
          <text class="small muted step-desc">
            文本型 PDF 的解析需要先通过兼容性验证，当前版本请优先使用 JSON。
          </text>
        </view>
        <text class="step-arrow">›</text>
      </view>
    </view>

    <view class="section">
      <SectionTitle title="格式说明" />
      <view class="card format-card">
        <view class="format-row">
          <text class="tag">必填</text>
          <text class="small">schema：quizbank/v1</text>
        </view>
        <view class="format-row">
          <text class="tag">必填</text>
          <text class="small">meta.name、questions</text>
        </view>
        <view class="format-row">
          <text class="tag">题型</text>
          <text class="small">single / multiple / judge</text>
        </view>
        <view class="format-row">
          <text class="tag">答案</text>
          <text class="small">选项 key 数组，如 ["A"]、["A","C"]</text>
        </view>
        <view class="format-row">
          <text class="tag">判断</text>
          <text class="small">A=正确，B=错误</text>
        </view>

        <view class="divider" />
        <view class="row between" @tap="showExample = !showExample">
          <text class="small bold">查看示例片段</text>
          <text class="small pregency">{{ showExample ? '收起' : '展开' }}</text>
        </view>
        <text v-if="showExample" class="example">{{ exampleText }}</text>
      </view>
    </view>

    <view class="tips">
      <text class="small light">导入前会先校验并预览，错误题目可以在预览页修正或跳过。</text>
      <text class="small light">单文件上限 20MB，单库上限 20000 题。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { parseBankText } from '@/core/import/parseBank'
import { pickJsonFile } from '@/services/filePicker'
import { useImportStore } from '@/stores/import'
import SectionTitle from '@/components/SectionTitle.vue'

const importStore = useImportStore()
const showExample = ref(false)

const exampleText = `{
  "schema": "quizbank/v1",
  "meta": { "name": "计算机网络" },
  "questions": [
    {
      "type": "single",
      "stem": "TCP 属于哪一层协议？",
      "options": [
        { "key": "A", "text": "应用层" },
        { "key": "B", "text": "传输层" }
      ],
      "answer": ["B"],
      "analysis": "TCP 是传输层协议。"
    }
  ]
}`

onLoad(() => {
  importStore.clear()
})

async function chooseJson(): Promise<void> {
  uni.showLoading({ title: '读取文件…', mask: true })
  try {
    const file = await pickJsonFile()
    if (!file) return
    const draft = parseBankText(file.text)
    importStore.setDraft(draft)
    uni.navigateTo({ url: '/pages/import/preview' })
  } catch (error) {
    const message = error instanceof Error ? error.message : '导入失败'
    uni.showModal({ title: '导入失败', content: message, showCancel: false })
  } finally {
    uni.hideLoading()
  }
}

function goPdf(): void {
  uni.navigateTo({ url: '/pages/import/pdf' })
}
</script>

<style scoped lang="scss">
.intro {
  padding: 32rpx;
}

.intro-text {
  display: block;
  margin-top: 12rpx;
  line-height: 1.6;
}

.step-card {
  margin-top: 20rpx;
  padding: 28rpx;
}

.step-title {
  font-size: 30rpx;
  font-weight: 600;
}

.step-desc {
  display: block;
  margin-top: 8rpx;
  line-height: 1.6;
}

.step-arrow {
  margin-left: 16rpx;
  color: $text-light;
  font-size: 44rpx;
}

.format-card {
  padding: 24rpx 28rpx;
}

.format-row {
  display: flex;
  align-items: center;
  min-height: 56rpx;
}

.format-row .tag {
  width: 92rpx;
  margin-right: 16rpx;
  justify-content: center;
}

.pregency {
  color: $primary;
}

.example {
  display: block;
  margin-top: 16rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  font-family: Menlo, Consolas, monospace;
  font-size: 20rpx;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
}

.tips {
  padding: 32rpx 8rpx;
}

.tips text {
  display: block;
  margin-bottom: 8rpx;
}
</style>
