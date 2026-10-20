<script setup>
/**
 * 工作台首页（PRD 首页看板）
 * 待处理统计卡片 + 快捷入口 + 最近业务单据（按登录用户数据隔离）
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { queryDashboard } from '../../api'
import { INBOUND_STATUS, OUTBOUND_STATUS, REBRAND_STATUS, RETURN_STATUS } from '../../utils/status'
import { tl } from '../../utils/i18n'
import { useUserStore } from '../../store/user'

defineOptions({ name: 'Dashboard' })

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const stats = ref({})
const recent = ref([])

// 各业务状态机映射（用于最近单据状态标签）
const STATUS_MAPS = {
  inbound: INBOUND_STATUS,
  outbound: OUTBOUND_STATUS,
  rebrand: REBRAND_STATUS,
  return: RETURN_STATUS
}
// 业务类型 → 列表页跳转
const BIZ_LINKS = {
  inbound: '/inbound/all',
  outbound: '/outbound/outbound-all',
  rebrand: '/fbarebrand/rebrand-djh',
  return: '/return/return-dlh'
}

/** 待处理统计卡片：点击跳转对应处理页 */
const statCards = [
  { key: 'statInbound', icon: 'Van', field: 'inboundPending', color: '#409eff', bg: '#ecf5ff', link: '/inbound/pickup' },
  { key: 'statOutbound', icon: 'Truck', field: 'outboundPending', color: '#e6a23c', bg: '#fdf6ec', link: '/outbound/outbound-djh' },
  { key: 'statRebrand', icon: 'PriceTag', field: 'rebrandPending', color: '#7c3aed', bg: '#f4effc', link: '/fbarebrand/rebrand-djh' },
  { key: 'statReturn', icon: 'RefreshLeft', field: 'returnPending', color: '#f56c6c', bg: '#fef0f0', link: '/return/return-dlh' },
  { key: 'statBills', icon: 'WalletFilled', field: 'billsPending', color: '#67c23a', bg: '#f0f9eb', link: '/finance/payment' },
  { key: 'statMessages', icon: 'Bell', field: 'unreadMessages', color: '#009688', bg: '#e6f4f3', link: '/profile' }
]

/** 快捷入口 */
const quickLinks = [
  { key: 'inboundCreate', link: '/inbound/create' },
  { key: 'outboundCreate', link: '/outbound/create' },
  { key: 'rebrandCreate', link: '/fbarebrand/create' },
  { key: 'returnCreate', link: '/return/create' },
  { key: 'stockInquiry', link: '/stock/inquiry' },
  { key: 'product', link: '/basic/product' }
]

async function load() {
  loading.value = true
  try {
    const res = await queryDashboard()
    stats.value = res.stats || {}
    recent.value = res.recent || []
  } finally {
    loading.value = false
  }
}

onMounted(load)

function go(path) {
  router.push(path)
}

function statusTagOf(row) {
  const m = STATUS_MAPS[row.bizType]?.[row.status]
  return m ? { type: m.tag || 'info', text: tl(m.key, m.zh) } : { type: 'info', text: row.status }
}
</script>

<template>
  <div class="page-wrap dashboard" v-loading="loading">
    <!-- 欢迎条 -->
    <div class="dash-banner">
      <div class="banner-text">
        <div class="banner-title">{{ tl('dashboard.welcome', '欢迎回来') }}，{{ userStore.username }}</div>
        <div class="banner-sub">{{ tl('dashboard.subtitle', '这是您当前账户的业务概览') }}</div>
      </div>
      <div class="banner-extra">
        <span v-if="stats.productPendingAudit">{{ tl('dashboard.auditPending', '产品待审核') }}：{{ stats.productPendingAudit }}</span>
        <span v-if="stats.billsPending">{{ tl('dashboard.pendingAmount', '待支付金额') }}：￥{{ (stats.billsPendingAmount || 0).toFixed(2) }}</span>
      </div>
    </div>

    <!-- 待处理统计卡片 -->
    <div class="stat-grid">
      <div
        v-for="c in statCards"
        :key="c.key"
        class="stat-card"
        :style="{ background: c.bg }"
        @click="go(c.link)"
      >
        <div class="stat-icon" :style="{ background: c.color }">
          <el-icon><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value" :style="{ color: c.color }">{{ stats[c.field] ?? 0 }}</div>
          <div class="stat-label">{{ tl(`dashboard.${c.key}`, c.key) }}</div>
        </div>
      </div>
    </div>

    <el-row :gutter="12">
      <!-- 快捷入口 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="dash-card">
          <template #header>
            <b>{{ tl('dashboard.quickTitle', '快捷入口') }}</b>
          </template>
          <div class="quick-grid">
            <div v-for="q in quickLinks" :key="q.key" class="quick-item" @click="go(q.link)">
              <el-icon class="quick-icon"><Plus /></el-icon>
              <span>{{ tl(`menu.${q.key}`, q.key) }}</span>
            </div>
          </div>
          <div class="stock-summary">
            {{ tl('dashboard.stockSummary', '库存概要') }}：{{ tl('dashboard.onHand', '在库') }} {{ stats.onHandTotal ?? 0 }}
            ／ {{ tl('dashboard.available', '可库') }} {{ stats.availableTotal ?? 0 }}
            （{{ stats.skuTotal ?? 0 }} SKU）
          </div>
        </el-card>
      </el-col>

      <!-- 最近业务单据 -->
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="dash-card">
          <template #header>
            <div class="card-head">
              <b>{{ tl('dashboard.recentTitle', '最近业务单据') }}</b>
              <el-button link type="primary" size="small" @click="go('/inbound/all')">{{ tl('dashboard.viewAll', '查看全部') }}</el-button>
            </div>
          </template>
          <el-empty v-if="!recent.length" :description="tl('dashboard.noRecent', '暂无业务单据')" :image-size="60" />
          <el-table v-else :data="recent" size="small" border @row-click="(row) => go(BIZ_LINKS[row.bizType])">
            <el-table-column :label="tl('dashboard.colType', '业务类型')" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ tl(`dashboard.biz${row.bizType[0].toUpperCase()}${row.bizType.slice(1)}`, row.bizType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="code" :label="tl('dashboard.colCode', '单号')" min-width="170" show-overflow-tooltip />
            <el-table-column prop="warehouse" :label="tl('dashboard.colWarehouse', '仓库')" min-width="120" show-overflow-tooltip />
            <el-table-column :label="tl('dashboard.colStatus', '状态')" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="statusTagOf(row).type">{{ statusTagOf(row).text }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" :label="tl('dashboard.colCreateTime', '创建时间')" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard { min-height: 100%; }
.dash-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px 20px;
  margin-bottom: 12px;
  border-radius: 6px;
  background: linear-gradient(120deg, #1f3b73 0%, #2f6fb3 60%, #43a1d8 100%);
  color: #fff;
}
.banner-title { font-size: 17px; font-weight: 700; }
.banner-sub { font-size: 12px; opacity: 0.85; margin-top: 4px; }
.banner-extra { display: flex; gap: 16px; font-size: 12px; opacity: 0.9; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); }
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  flex: none;
}
.stat-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 12px; color: #606266; margin-top: 2px; }

.dash-card :deep(.el-card__header) { padding: 10px 16px; }
.card-head { display: flex; align-items: center; justify-content: space-between; }
.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
  border-radius: 6px;
  background: #f5f7fa;
  cursor: pointer;
  font-size: 12px;
  color: #303133;
  transition: background 0.15s;
}
.quick-item:hover { background: #ecf5ff; color: #409eff; }
.quick-icon { font-size: 18px; }
.stock-summary { margin-top: 12px; font-size: 12px; color: #909399; }
</style>
