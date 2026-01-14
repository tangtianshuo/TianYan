<template>
	<div class="wrapper">
		<div class="toolbar">
			<div class="left">
				<span class="label">{{ t("grid.operation") }}：</span>
				<button
					class="btn"
					@click="handleSave"
				>
					{{ t("grid.save") }}
				</button>
				<!-- <button
					v-if="false"
					class="btn"
					@click="handlePrint"
				>
					{{ t('grid.export') }}
				</button> -->
				<select
					v-model="selectedDunJu"
					class="select"
				>
					<option
						v-for="o in dunJuOptions"
						:key="o.id"
						:value="o.value"
					>
						{{ o.label }}
					</option>
				</select>
				<label class="label">
					<input
						type="checkbox"
						v-model="enableJieQi"
					/>
					节气模式
				</label>
				<button
					v-if="false"
					class="btn"
					@click="applyQimenLayout"
				>
					奇门排盘
				</button>
				<div class="time-controls">
					<span class="label">时间：</span>
					<label class="label">
						<input
							type="radio"
							value="solar"
							v-model="calendarMode"
						/>阳历
					</label>
					<label class="label">
						<input
							type="radio"
							value="lunar"
							v-model="calendarMode"
						/>阴历
					</label>
					<label class="label">
						<input
							type="radio"
							value="jieqi"
							v-model="calendarMode"
						/>节气
					</label>
					<input
						v-if="calendarMode !== 'jieqi'"
						type="date"
						v-model="dateStr"
						class="input"
					/>
					<input
						v-if="calendarMode !== 'jieqi'"
						type="time"
						v-model="timeStr"
						class="input"
					/>
					<select
						v-if="calendarMode === 'jieqi'"
						v-model="selectedJieQi"
						class="select"
					>
						<option
							v-for="j in jieQiOptions"
							:key="j"
							:value="j"
						>
							{{ j }}
						</option>
					</select>
				</div>
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
	import { ConfigManager } from "@/utils/config-loader"
	import { useI18n } from "@/utils/i18n"
	import { useToast } from "@/composables/useToast"
	import type { AppConfig } from "@/types"
	import {
		computeLayout,
		parseDunJu,
		inferDunByJieQi,
		inferDunByJieQiName,
	} from "@/utils/qimen"

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

	const formName = ref<string>("")
	const formCategory = ref<string>("")

	const dunJuOptions = ref<any[]>([])
	const selectedDunJu = ref<string>("")
	const enableJieQi = ref<boolean>(false)
	const calendarMode = ref<"solar" | "lunar" | "jieqi">("solar")
	const dateStr = ref<string>(new Date().toISOString().slice(0, 10))
	const timeStr = ref<string>(new Date().toTimeString().slice(0, 5))
	const selectedJieQi = ref<string>("立春")
	const jieQiOptions = [
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
	const showOverlay = ref<boolean>(false)
	const overlayLabels = ref<
		Array<{ di?: string; tian?: string; ren?: string; shen?: string }>
	>(Array(9).fill({}))

	const {
		cells,
		getAllSelectedValues,
		updateDropdownValue,
		printGridStateToConsole,
		saveGridState,
		deserializeGridState,
		initializeGrid,
	} = useGridState()

	const selectedValues = computed(() => getAllSelectedValues())

	const selectedDate = computed(() => {
		const [h, m] = timeStr.value.split(":").map((x) => parseInt(x || "0", 10))
		const d = new Date(`${dateStr.value}T00:00:00`)
		d.setHours(h || 0, m || 0, 0, 0)
		return d
	})

	const disabled = computed(() => {
		return Array.from(props.mutualExclusiveValues || new Set<string>())
	})

	onMounted(() => {
		initializeGrid()
		loadDunJu()
	})

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

	// const handlePrint = (): void => {
	// 	printGridStateToConsole()
	// }

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
		refreshOverlay()
	}

	const loadDunJu = async () => {
		try {
			const opts = await ConfigManager.getOptionsForCategory("遁局")
			dunJuOptions.value = opts
			selectedDunJu.value = opts[0]?.value || "yang1"
		} catch (e) {}
	}

	const refreshOverlay = async () => {
		const base = parseDunJu(selectedDunJu.value || "yang1")
		const dun =
			calendarMode.value === "jieqi"
				? inferDunByJieQiName(selectedJieQi.value, base)
				: enableJieQi.value
				? inferDunByJieQi(selectedDate.value, base)
				: base
		const layout = computeLayout(selectedDate.value, dun)

		const isSanQi = (v: string) => v === "yi" || v === "bing" || v === "ding"

		let ganMap = new Map<string, string>()
		let menMap = new Map<string, string>()
		let shenMap = new Map<string, string>()
		try {
			const gan = await ConfigManager.getOptionsForCategory("天干")
			gan.forEach((o: any) => ganMap.set(o.value, o.label))
			const men = await ConfigManager.getOptionsForCategory("八门")
			men.forEach((o: any) => menMap.set(o.value, o.label))
			const shen = await ConfigManager.getOptionsForCategory("八神")
			shen.forEach((o: any) => shenMap.set(o.value, o.label))
		} catch {}

		cells.value.forEach((cell, idx) => {
			const diVal = layout.diPan[idx]
			if (isSanQi(diVal)) {
				updateDropdownValue(cell.cellId, 0, diVal, null)
				updateDropdownValue(cell.cellId, 1, null, null)
			} else {
				updateDropdownValue(cell.cellId, 1, diVal, null)
				updateDropdownValue(cell.cellId, 0, null, null)
			}

			const menVal = layout.renPan[idx]
			updateDropdownValue(cell.cellId, 2, menVal, null)

			const starVal = layout.jiuXing[idx]
			updateDropdownValue(cell.cellId, 3, starVal, null)
			overlayLabels.value[idx] = {
				di: ganMap.get(diVal) || diVal,
				tian: ganMap.get(layout.tianPan[idx]) || layout.tianPan[idx],
				ren: menMap.get(menVal) || menVal,
				shen: shenMap.get(layout.baShen[idx]) || layout.baShen[idx],
			}
		})

		emit("state-change", {
			selectedValues: selectedValues.value,
			count: selectedValues.value.length,
		})
		showOverlay.value = true
	}

	const applyQimenLayout = async () => {
		await refreshOverlay()
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

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		gap: 1rem;
		flex-wrap: wrap;
	}

	.left,
	.right {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.time-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;
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
		.toolbar {
			flex-direction: column;
			align-items: flex-start;
		}

		.right {
			width: 100%;
			gap: 0.5rem;
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
