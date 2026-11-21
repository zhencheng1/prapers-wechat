<script setup lang="ts">
import { onLaunch, onHide } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/app'
import { flushAll } from '@/core/storage/persist'

onLaunch(() => {
  void useAppStore().ensureReady()
})

onHide(() => {
  flushAll()
})
</script>

<style lang="scss">
@import './styles/global.scss';
</style>
