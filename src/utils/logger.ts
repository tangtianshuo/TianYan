/**
 * 日志管理工具
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
	timestamp: number
	level: LogLevel
	message: string
	data?: any
}

class Logger {
	private logs: LogEntry[] = []
	private maxLogs = 1000
	private isDevelopment = Boolean((import.meta as any).env?.DEV)

	log(level: LogLevel, message: string, data?: any) {
		const entry: LogEntry = {
			timestamp: Date.now(),
			level,
			message,
			data,
		}

		this.logs.push(entry)

		// 保持日志数量在限制内
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs)
		}

		// 开发模式下输出到控制台
		if (this.isDevelopment) {
			const prefix = `[${level.toUpperCase()}] [v0]`
			if (data) {
				console.log(prefix, message, data)
			} else {
				console.log(prefix, message)
			}
		}
	}

	debug(message: string, data?: any) {
		this.log("debug", message, data)
	}

	info(message: string, data?: any) {
		this.log("info", message, data)
	}

	warn(message: string, data?: any) {
		this.log("warn", message, data)
	}

	error(message: string, data?: any) {
		this.log("error", message, data)
	}

	getLogs(filter?: { level?: LogLevel; limit?: number }): LogEntry[] {
		let result = [...this.logs]

		if (filter?.level) {
			result = result.filter((l) => l.level === filter.level)
		}

		if (filter?.limit) {
			result = result.slice(-filter.limit)
		}

		return result
	}

	clearLogs() {
		this.logs = []
	}

	exportLogs(): string {
		return JSON.stringify(this.logs, null, 2)
	}
}

export const logger = new Logger()
