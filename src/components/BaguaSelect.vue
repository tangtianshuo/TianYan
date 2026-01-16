<template>
	<div class="bagua-select">
		<div class="select-wrapper">
			<button
				:aria-expanded="isOpen"
				aria-haspopup="listbox"
				:aria-labelledby="`label-${id}`"
				class="select-trigger ink-border ink-transition"
				@click="toggleOpen"
			>
				<span
					class="selected-value"
					:class="customClass"
				>
					{{ selectedLabel || placeholder || t("grid.select") }}
				</span>
				<span
					v-if="modelValue && !disabled"
					class="clear-icon"
					@click.stop="clearSelection"
				>
					✕
				</span>
				<span
					class="select-icon"
					:class="{ rotate: isOpen }"
				>
					▼
				</span>
			</button>

			<transition
				name="slide-fade"
				@enter="onDropdownEnter"
				@leave="onDropdownLeave"
			>
				<div
					v-if="isOpen"
					role="listbox"
					class="select-dropdown ink-border"
				>
					<div
						v-if="tabs.length"
						class="select-tabs"
					>
						<button
							v-for="t in tabs"
							:key="t"
							class="tab-btn"
							:class="{ active: t === activeTab }"
							@click="activeTab = t"
						>
							{{ t }}
						</button>
					</div>

					<div
						v-if="filteredOptions.length === 0"
						class="select-empty"
					>
						{{ emptyText || t("grid.empty") }}
					</div>

					<button
						v-for="option in filteredOptions"
						:key="option.id"
						role="option"
						:aria-selected="option.value === modelValue"
						:disabled="option.disabled"
						class="select-option ink-transition"
						:class="{
							selected: option.value === modelValue,
							disabled: option.disabled,
						}"
						@click="selectOption(option)"
					>
						{{ option.label }}
					</button>
				</div>
			</transition>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted, watch } from "vue"
	import type { SelectOption } from "@/types"
	import { useI18n } from "@/utils/i18n"

	interface Props {
		id: string
		modelValue: string | null
		options: SelectOption[]
		placeholder?: string
		emptyText?: string
		disabled?: boolean
		searchable?: boolean
		groupedOptions?: Record<string, SelectOption[]>
		customClass?: string
	}

	interface Emits {
		(e: "update:modelValue", value: string | null): void
		(e: "change", value: string | null, label: string | null): void
		(e: "blur"): void
	}

	const props = withDefaults(defineProps<Props>(), {
		placeholder: "",
		emptyText: "",
		disabled: false,
		searchable: true,
	})

	const emit = defineEmits<Emits>()
	const { t } = useI18n()

	const isOpen = ref(false)
	const searchText = ref("")
	const activeTab = ref<string>("")

	const selectedLabel = computed(() => {
		// 优先从 options 中查找
		let option = props.options.find((o) => o.value === props.modelValue)
		if (option) return option.label

		// 如果没找到，且有 groupedOptions，遍历所有 group 找
		if (props.groupedOptions) {
			for (const key in props.groupedOptions) {
				option = props.groupedOptions[key].find(
					(o) => o.value === props.modelValue
				)
				if (option) return option.label
			}
		}
		return null
	})

	const tabs = computed(() => {
		const keys = props.groupedOptions ? Object.keys(props.groupedOptions) : []
		if (!activeTab.value && keys.length) {
			activeTab.value = keys[0]
		}
		return keys
	})

	const baseOptions = computed(() => {
		if (props.groupedOptions && activeTab.value) {
			return props.groupedOptions[activeTab.value] || []
		}
		return props.options
	})

	const filteredOptions = computed(() => {
		const list = baseOptions.value
		if (!props.searchable || !searchText.value) {
			return list
		}
		return list.filter((option) =>
			option.label.toLowerCase().includes(searchText.value.toLowerCase())
		)
	})

	const toggleOpen = () => {
		if (!props.disabled) {
			isOpen.value = !isOpen.value
		}
	}

	const selectOption = (option: SelectOption) => {
		if (!option.disabled) {
			emit("update:modelValue", option.value)
			emit("change", option.value, option.label)
			isOpen.value = false
			searchText.value = ""
		}
	}

	const clearSelection = () => {
		if (!props.disabled) {
			emit("update:modelValue", null)
			emit("change", null, null)
		}
	}

	const closeDropdown = () => {
		isOpen.value = false
		emit("blur")
	}

	const handleClickOutside = (event: MouseEvent) => {
		const target = event.target as HTMLElement
		if (!target.closest(".bagua-select")) {
			closeDropdown()
		}
	}

	const onDropdownEnter = (el: Element) => {
		const element = el as HTMLElement
		element.style.opacity = "0"
		element.style.transform = "translateY(-10px)"
		element.offsetHeight
		element.style.opacity = "1"
		element.style.transform = "translateY(0)"
	}

	const onDropdownLeave = (el: Element) => {
		const element = el as HTMLElement
		element.style.opacity = "0"
		element.style.transform = "translateY(-10px)"
	}

	watch(
		() => props.modelValue,
		() => {
			searchText.value = ""
		}
	)

	onMounted(() => {
		document.addEventListener("click", handleClickOutside)
	})

	onUnmounted(() => {
		document.removeEventListener("click", handleClickOutside)
	})
</script>

<style scoped lang="css">
	.bagua-select {
		width: 100%;
		position: relative;
		font-family: inherit;
	}

	.select-wrapper {
		position: relative;
		width: 100%;
	}

	.select-trigger {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		background-color: var(--color-card);
		color: var(--color-foreground);
		border-radius: var(--radius-md);
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		text-align: left;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.select-trigger:hover:not(:disabled) {
		border-color: var(--color-primary);
		background-color: var(--color-muted);
	}

	.select-trigger:focus {
		outline: 2px solid transparent;
		outline-offset: 2px;
		box-shadow: 0 0 0 3px var(--color-ring, currentColor);
		opacity: 0.8;
	}

	.select-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.selected-value {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.select-icon {
		flex-shrink: 0;
		width: 1em;
		height: 1em;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		transition: transform 0.2s ease;
	}

	.clear-icon {
		flex-shrink: 0;
		width: 1.2em;
		height: 1.2em;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		border-radius: 50%;
		transition: all 0.2s ease;
	}
	.clear-icon:hover {
		background-color: var(--color-border);
		color: var(--color-foreground);
	}

	.select-icon.rotate {
		transform: rotate(180deg);
	}

	.select-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.25rem;
		background-color: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		z-index: 1000;
		min-width: 100%;
		max-height: 300px;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.select-tabs {
		display: flex;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		background-color: var(--color-card);
		z-index: 1;
	}

	.tab-btn {
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-muted);
		color: var(--color-foreground);
		font-size: 0.75rem;
		cursor: pointer;
	}

	.tab-btn.active {
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.select-empty {
		padding: 0.75rem;
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
	}

	.select-option {
		width: 100%;
		padding: 0.5rem 0.75rem;
		text-align: left;
		border: none;
		background-color: transparent;
		color: var(--color-foreground);
		cursor: pointer;
		font-size: 0.875rem;
		line-height: 1.5;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
	}

	.select-option:hover:not(.disabled) {
		background-color: var(--color-muted);
	}

	.select-option.selected {
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
		font-weight: 500;
	}

	.select-option.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		color: var(--color-muted-foreground);
	}

	.slide-fade-enter-active,
	.slide-fade-leave-active {
		transition: all 0.2s ease;
	}

	.slide-fade-enter-from {
		opacity: 0;
		transform: translateY(-10px);
	}

	.slide-fade-leave-to {
		opacity: 0;
		transform: translateY(-10px);
	}
</style>
