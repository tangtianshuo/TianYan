import { ref } from "vue"
import ToastMessage from "@/components/ToastMessage.vue"

const toastRef = ref<InstanceType<typeof ToastMessage> | null>(null)

export function useToast() {
	const showToast = (
		message: string,
		type: "success" | "error" | "info" = "info"
	) => {
		if (toastRef.value) {
			toastRef.value.show(message, type)
		} else {
			console.warn("Toast component not mounted or ref not set")
		}
	}

	return {
		toastRef,
		showToast,
	}
}
