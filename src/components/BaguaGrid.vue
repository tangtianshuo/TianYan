<template>
	<div class="wrapper">
		<div class="toolbar-container">
			<!-- Row 1: Qimen Parameters -->
			<div class="toolbar-row params-row">
				<div class="param-group">
					<span class="label">排盘方式:</span>
					<select
						v-model="panStyle"
						class="select small"
					>
						<option value="zhuan">转盘奇门</option>
						<option value="fei">飞盘奇门</option>
					</select>
				</div>
				<div class="param-group">
					<span class="label">遁局:</span>
					<select
						v-model="dunType"
						class="select small"
					>
						<option value="yang">阳遁</option>
						<option value="yin">阴遁</option>
					</select>
					<select
						v-model="juNum"
						class="select small"
					>
						<option
							v-for="n in 9"
							:key="n"
							:value="n"
						>
							{{ n }}局
						</option>
					</select>
				</div>
				<div class="param-group">
					<span class="label">日期:</span>
					<input
						type="date"
						v-model="dateStr"
						class="input small-date"
					/>
				</div>
				<div class="param-group">
					<span class="label">节气:</span>
					<select
						v-model="selectedJieQi"
						class="select small"
					>
						<option value="">(可选)</option>
						<option
							v-for="jq in JIE_QI"
							:key="jq"
							:value="jq"
						>
							{{ jq }}
						</option>
					</select>
				</div>
				<div class="param-group">
					<span class="label">时辰:</span>
					<select
						v-model="shiGan"
						class="select small"
					>
						<option
							v-for="g in TIAN_GAN"
							:key="g"
							:value="g"
						>
							{{ g }}
						</option>
					</select>
					<select
						v-model="shiZhi"
						class="select small"
					>
						<option
							v-for="z in DI_ZHI"
							:key="z"
							:value="z"
						>
							{{ z }}
						</option>
					</select>
				</div>
				<button
					class="btn primary"
					@click="handleQiJu"
				>
					起局
				</button>
			</div>

			<!-- Row 2: Operations & Info -->
			<div class="toolbar-row operations-row">
				<div class="left">
					<button
						class="btn"
						@click="handleReset"
					>
						重置
					</button>
					<button
						class="btn"
						@click="handleSave"
					>
						{{ t("grid.save") }}
					</button>
					<button
						class="btn"
						@click="handleExport"
					>
						导出文本
					</button>
					<span class="divider">|</span>
					<span
						class="info-text"
						v-if="qimenMeta"
					>
						{{ juInfoText }}
					</span>
				</div>
				<div class="right">
					<select
						v-model="formCategory"
						class="select"
					>
						<option value="">{{ t("grid.uncategorized") }}</option>
						<option value="金">金</option>
						<option value="木">木</option>
						<option value="水">水</option>
						<option value="火">火</option>
						<option value="土">土</option>
					</select>
					<input
						v-model="formName"
						type="text"
						class="input"
						:placeholder="t('grid.configName')"
					/>
				</div>
			</div>
		</div>

		<div class="grid-box">
			<div class="grid">
				<BaguaCell
					v-for="(cell, idx) in cells"
					:key="cell.cellId"
					:cell-id="cell.cellId"
					:dropdowns="cell.dropdowns"
					:selected-values="selectedValues"
					:disabled-values="disabled"
					:overlay-labels="showOverlay ? overlayLabels[idx] : undefined"
					@update="
						(index, value, label) => onUpdate(cell.cellId, index, value, label)
					"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted } from "vue"
	import BaguaCell from "./BaguaCell.vue"
	import { useGridState } from "@/composables/useGridState"
	import { useI18n } from "@/utils/i18n"
	import { useToast } from "@/composables/useToast"
	import type { AppConfig, PanStyle, DunType } from "@/types"
	import { formatQiMenResult } from "@/utils/qimen"

	const props = defineProps<{
		config?: AppConfig
		mutualExclusiveValues?: Set<string>
	}>()

	const { t } = useI18n()
	const { showToast } = useToast()

	const emit = defineEmits<{
		"state-change": [data: { selectedValues: string[]; count: number }]
		save: []
	}>()

	// Constants
	const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
	const DI_ZHI = [
		"子",
		"丑",
		"寅",
		"卯",
		"辰",
		"巳",
		"午",
		"未",
		"申",
		"酉",
		"戌",
		"亥",
	]
	const JIE_QI = [
		"立春",
		"雨水",
		"惊蛰",
		"春分",
		"清明",
		"谷雨",
		"立夏",
		"小满",
		"芒种",
		"夏至",
		"小暑",
		"大暑",
		"立秋",
		"处暑",
		"白露",
		"秋分",
		"寒露",
		"霜降",
		"立冬",
		"小雪",
		"大雪",
		"冬至",
		"小寒",
		"大寒",
	]

	// UI State
	const formName = ref<string>("")
	const formCategory = ref<string>("")
	const showOverlay = ref<boolean>(false)

	// Create computed property for overlayLabels directly from cells
	const overlayLabels = computed(() => {
		return cells.value.map((cell) => {
			if (!cell.qimen) return {}
			return {
				di: cell.qimen.diPan,
				tian: cell.qimen.tianPan,
				ren: cell.qimen.baMen,
				shen: cell.qimen.baShen,
			}
		})
	})

	// Qimen Parameters
	const panStyle = ref<PanStyle>("zhuan")
	const dunType = ref<DunType>("yang")
	const juNum = ref<number>(1)
	const shiGan = ref<string>("甲")
	const shiZhi = ref<string>("子")
	const dateStr = ref<string>(new Date().toISOString().slice(0, 10))
	const selectedJieQi = ref<string>("")

	const {
		cells,
		getAllSelectedValues,
		updateDropdownValue,
		printGridStateToConsole,
		saveGridState,
		deserializeGridState,
		initializeGrid,
		applyQiMenLayout,
		qimenMeta,
		currentQimenResult,
	} = useGridState()

	const selectedValues = computed(() => getAllSelectedValues())

	const disabled = computed(() => {
		return Array.from(props.mutualExclusiveValues || new Set<string>())
	})

	const juInfoText = computed(() => {
		if (!qimenMeta.value) return ""
		const { dunType, juNum, shiGan, shiZhi, xunShou, zhiFu, zhiShi } =
			qimenMeta.value
		const dunStr = dunType === "yang" ? "阳遁" : "阴遁"
		return `${dunStr}${juNum}局 ${shiGan}${shiZhi}时 旬首:${xunShou} 值符:${zhiFu} 值使:${zhiShi}`
	})

	onMounted(() => {
		initializeGrid()
	})

	const handleQiJu = () => {
		applyQiMenLayout(
			panStyle.value,
			dunType.value,
			juNum.value,
			shiGan.value,
			shiZhi.value
		)
		showOverlay.value = true // Ensure overlay is shown after QiJu
		showToast("排盘成功", "success")
	}

	const handleReset = () => {
		initializeGrid()
		formName.value = ""
		formCategory.value = ""
		showToast("已重置", "success")
	}

	const handleSave = (): void => {
		if (!formName.value.trim()) {
			showToast(t("grid.enterName"), "error")
			return
		}
		saveGridState(formName.value, formCategory.value || t("grid.uncategorized"))
		emit("save")
		showToast(t("grid.saveSuccess"), "success")
		formName.value = ""
		formCategory.value = ""
	}

	const handleExport = async () => {
		if (!currentQimenResult.value) {
			showToast("请先进行起局排盘", "error")
			return
		}

		try {
			const text = formatQiMenResult(
				currentQimenResult.value,
				panStyle.value,
				dunType.value,
				juNum.value
			)
			await navigator.clipboard.writeText(text)
			showToast("排盘结果已复制到剪贴板", "success")
		} catch (err) {
			console.error(err)
			showToast("复制失败", "error")
		}
	}

	const onUpdate = (
		cellId: string,
		dropdownIndex: number,
		value: string | null,
		label: string | null
	): void => {
		updateDropdownValue(cellId, dropdownIndex, value, label)
		emit("state-change", {
			selectedValues: selectedValues.value,
			count: selectedValues.value.length,
		})
	}

	defineExpose({
		deserializeGridState,
		printGridStateToConsole,
		loadState: deserializeGridState,
		overlayLabels,
	})
</script>

<style scoped lang="css">
	.wrapper {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.toolbar-container {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.toolbar-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.params-row {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.param-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.operations-row .left,
	.operations-row .right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.select.small {
		padding: 0.35rem 0.5rem;
		min-width: 70px;
	}

	.input.small-date {
		padding: 0.35rem 0.5rem;
		min-width: 120px;
		font-size: 0.875rem;
	}

	.divider {
		color: var(--color-border);
		margin: 0 0.25rem;
	}

	.info-text {
		font-size: 0.875rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.btn.primary {
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
		border-color: var(--color-primary);
	}

	.label {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		font-weight: 500;
	}

	.btn {
		padding: 0.5rem 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background-color: transparent;
		color: var(--color-foreground);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.btn:hover {
		border-color: var(--color-primary);
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.select,
	.input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background-color: var(--color-card);
		color: var(--color-foreground);
		font-size: 0.875rem;
		font-family: inherit;
	}

	.select:focus,
	.input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
	}

	.grid-box {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background-color: var(--color-card);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		padding: 2rem;
		min-width: 900px;
	}

	@media (max-width: 1024px) {
		.grid {
			gap: 0.75rem;
			padding: 1.5rem;
			min-width: 100%;
		}
	}

	@media (max-width: 768px) {
		.toolbar-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.params-row {
			align-items: flex-start;
		}

		.param-group {
			width: 100%;
			justify-content: space-between;
		}

		.operations-row .right {
			width: 100%;
		}

		.input {
			flex: 1;
		}

		.grid {
			gap: 0.5rem;
			padding: 1rem;
		}
	}

	@media (max-width: 480px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.5rem;
			padding: 0.75rem;
		}

		.btn {
			padding: 0.375rem 0.625rem;
			font-size: 0.75rem;
		}
	}
</style>
