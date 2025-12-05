<template>
	<div class="main-app">
		<div class="app-container">
			<!-- 左侧树形列表 -->
			<div class="app-sidebar">
				<SidebarTree @load="handleLoadRecord" />
			</div>

			<!-- 右侧主内容 -->
			<div class="app-main">
				<div class="main-header">
					<div class="header-info">
						<h1 class="app-title">奇门遁甲</h1>
						<!-- <p class="app-subtitle">中式水墨风格配置工具</p> -->
					</div>

					<div class="header-actions">
						<button
							class="header-btn refresh-btn"
							@click="refreshConfig"
							title="刷新配置"
						>
							⟳ 刷新配置
						</button>
						<!-- <button
							class="header-btn console-btn"
							@click="openConsole"
							title="打开控制台"
						>
							{ } 控制台
						</button> -->
					</div>
				</div>

				<!-- 九宫格 -->
				<div class="main-content">
					<div
						v-show="isLoading"
						class="loading-state"
					>
						加载中...
					</div>
					<BaguaGrid
						v-show="!isLoading"
						ref="gridRef"
						:config="config"
						:mutual-exclusive-values="mutualExclusiveValues"
						@state-change="handleStateChange"
						@save="handleSaveConfig"
					/>
				</div>

				<!-- 状态栏 -->
				<div class="main-footer">
					<div class="footer-stats">
						<span>选中项: {{ selectedCount }}</span>
						<span>·</span>
						<span>总项数: {{ totalItems }}</span>
						<span
							v-if="lastSaveTime"
							class="save-time"
						>
							· 最后保存: {{ formatTime(lastSaveTime) }}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue"
	import SidebarTree from "./SidebarTree.vue"
	import BaguaGrid from "./BaguaGrid.vue"
	import { ConfigManager } from "@/utils/config-loader"
	import type { SavedRecord } from "@/types"

	const gridRef = ref()
	const config = ref<any>(null)
	const isLoading = ref(true)
	const selectedCount = ref(0)
	const totalItems = ref(36)
	const lastSaveTime = ref<number | null>(null)
	const mutualExclusiveValues = ref<Set<string>>(new Set())

	// 刷新配置
	const refreshConfig = async () => {
		isLoading.value = true
		try {
			config.value = await ConfigManager.refreshConfig()
		} catch (error) {
			console.error("[MainApp] Error refreshing config:", error)
		} finally {
			isLoading.value = false
		}
	}

	// 处理加载保存的记录
	const handleLoadRecord = (record: SavedRecord) => {
		if (gridRef.value) {
			gridRef.value.loadState(record.data)
		}
	}

	// 处理状态改变
	const handleStateChange = (data: {
		selectedValues: string[]
		count: number
	}) => {
		selectedCount.value = data.count
		mutualExclusiveValues.value = new Set(data.selectedValues)
	}

	// 处理保存配置
	const handleSaveConfig = () => {
		lastSaveTime.value = Date.now()
	}

	// 打开控制台（开发用）
	// const openConsole = () => {
	// 	if (gridRef.value) {
	// 		gridRef.value.printToConsole()
	// 	}
	// }

	const formatTime = (timestamp: number): string => {
		const date = new Date(timestamp)
		return date.toLocaleTimeString("zh-CN")
	}

	onMounted(async () => {
		try {
			config.value = await ConfigManager.loadConfig()
		} catch (error) {
			console.error("[MainApp] Error loading config:", error)
		} finally {
			isLoading.value = false
		}
	})
</script>

<style scoped lang="css">
	.main-app {
		width: 100%;
		min-height: 100vh;
		background-color: var(--color-background);
		color: var(--color-foreground);
	}

	.app-container {
		display: flex;
		height: 100vh;
	}

	.app-sidebar {
		width: 280px;
		flex-shrink: 0;
		overflow-y: auto;
		border-right: 1px solid var(--color-border);
		background-color: var(--color-sidebar);
	}

	.app-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.main-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border);
		background-color: var(--color-card);
		flex-shrink: 0;
	}

	.header-info {
		flex: 1;
	}

	.app-title {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-foreground);
		letter-spacing: -0.02em;
	}

	.app-subtitle {
		margin: 0.25rem 0 0 0;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.header-btn {
		padding: 0.625rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background-color: var(--color-card);
		color: var(--color-foreground);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.header-btn:hover {
		border-color: var(--color-primary);
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.refresh-btn,
	.console-btn {
		font-family: "Courier New", monospace;
	}

	.main-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--color-muted-foreground);
		font-size: 1.125rem;
	}

	.main-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--color-border);
		background-color: var(--color-card);
		flex-shrink: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.footer-stats {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.save-time {
		color: var(--color-primary);
		font-weight: 500;
	}

	@media (max-width: 1024px) {
		.app-sidebar {
			width: 240px;
		}
	}

	@media (max-width: 768px) {
		.app-container {
			flex-direction: column;
			height: auto;
		}

		.app-sidebar {
			width: 100%;
			max-height: 300px;
			border-right: none;
			border-bottom: 1px solid var(--color-border);
		}

		.app-main {
			height: auto;
		}

		.main-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-info {
			width: 100%;
		}

		.app-title {
			font-size: 1.5rem;
		}

		.header-actions {
			width: 100%;
			justify-content: flex-start;
		}

		.main-content {
			padding: 1rem;
		}

		.main-footer {
			padding: 0.75rem 1rem;
			flex-wrap: wrap;
			gap: 1rem;
		}
	}

	@media (max-width: 480px) {
		.main-content {
			padding: 0.75rem;
		}

		.header-btn {
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
		}
	}
</style>
