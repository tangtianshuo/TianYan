<template>
	<div class="wrapper">
		<div class="toolbar">
			<div class="left">
				<span class="label">操作：</span>
				<button
					class="btn"
					@click="handleSave"
				>
					保存
				</button>
				<button
					class="btn"
					@click="handlePrint"
				>
					输出
				</button>
			</div>
			<div class="right">
				<select
					v-model="formCategory"
					class="select"
				>
					<option value="">未分类</option>
					<option value="jin">金</option>
					<option value="mu">木</option>
					<option value="shui">水</option>
					<option value="huo">火</option>
					<option value="tu">土</option>
				</select>
				<input
					v-model="formName"
					type="text"
					class="input"
					placeholder="配置名称"
				/>
			</div>
		</div>

		<div class="grid-box">
			<div class="grid">
				<BaguaCell
					v-for="cell in cells"
					:key="cell.cellId"
					:cell-id="cell.cellId"
					:dropdowns="cell.dropdowns"
					:selected-values="selectedValues"
					:disabled-values="disabled"
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

	const props = defineProps<{
		config?: any
		mutualExclusiveValues?: Set<string>
	}>()

	const emit = defineEmits<{
		"state-change": [data: { selectedValues: string[]; count: number }]
		save: []
	}>()

	const formName = ref<string>("")
	const formCategory = ref<string>("")

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

	const disabled = computed(() => {
		return Array.from(props.mutualExclusiveValues || new Set<string>())
	})

	onMounted(() => {
		initializeGrid()
	})

	const handleSave = (): void => {
		if (!formCategory.value.trim()) {
			alert("请选择分类")
			return
		}
		if (!formName.value.trim()) {
			alert("请输入配置名称")
			return
		}
		saveGridState(formName.value, formCategory.value || "未分类")
		emit("save")
		alert("保存成功")
		formName.value = ""
		formCategory.value = ""
	}

	const handlePrint = (): void => {
		printGridStateToConsole()
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
