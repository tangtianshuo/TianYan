/**
 * 奇门遁甲排盘核心引擎
 * 支持转盘奇门与飞盘奇门
 */

export type PanStyle = "zhuan" | "fei"
export type DunType = "yang" | "yin"

// 基础数据常量
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
const SAN_QI_LIU_YI = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"] // 阳遁顺序
const JIU_XING = [
	"天蓬",
	"天任",
	"天冲",
	"天辅",
	"天英",
	"天芮",
	"天柱",
	"天心",
	"天禽",
] // 原始宫位顺序: 坎8->艮8->震3->巽4->离9->坤2->兑7->乾6->中5
const BA_MEN = ["休", "生", "伤", "杜", "景", "死", "惊", "开"] // 原始宫位: 坎->艮->震->巽->离->坤->兑->乾
const BA_SHEN_ZHUAN = [
	"值符",
	"腾蛇",
	"太阴",
	"六合",
	"白虎",
	"玄武",
	"九地",
	"九天",
]
const BA_SHEN_FEI = [
	"值符",
	"腾蛇",
	"太阴",
	"六合",
	"勾陈",
	"朱雀",
	"九地",
	"九天",
	"玄武",
	"白虎",
] // 飞盘神序可能有差异，暂取一种常见版本

// 五行定义
export const WUXING = {
	WATER: "water",
	FIRE: "fire",
	WOOD: "wood",
	METAL: "metal",
	EARTH: "earth",
}

// 九星五行
export const JIU_XING_WUXING: Record<string, string> = {
	天蓬: WUXING.WATER,
	天任: WUXING.EARTH,
	天冲: WUXING.WOOD,
	天辅: WUXING.WOOD,
	天英: WUXING.FIRE,
	天芮: WUXING.EARTH,
	天柱: WUXING.METAL,
	天心: WUXING.METAL,
	天禽: WUXING.EARTH,
}

// 八门五行
export const BA_MEN_WUXING: Record<string, string> = {
	休: WUXING.WATER,
	生: WUXING.EARTH,
	伤: WUXING.WOOD,
	杜: WUXING.WOOD,
	景: WUXING.FIRE,
	死: WUXING.EARTH,
	惊: WUXING.METAL,
	开: WUXING.METAL,
}

// 洛书九宫顺序 (用于数组索引映射到宫位)
// 索引0-8分别对应：坎1, 坤2, 震3, 巽4, 中5, 乾6, 兑7, 艮8, 离9
// 注意：前端Grid通常是3x3，顺序是左上到右下。我们需要一个映射。
// Grid CellId: 0-0(巽4), 0-1(离9), 0-2(坤2)
//              1-0(震3), 1-1(中5), 1-2(兑7)
//              2-0(艮8), 2-1(坎1), 2-2(乾6)
const GRID_TO_GONG = [4, 9, 2, 3, 5, 7, 8, 1, 6]

// 宫位到数组索引的映射 (1-9 => index)
const GONG_TO_INDEX = {
	1: 7, // 坎
	2: 2, // 坤
	3: 3, // 震
	4: 0, // 巽
	5: 4, // 中
	6: 8, // 乾
	7: 5, // 兑
	8: 6, // 艮
	9: 1, // 离
}

// 原始宫位定义 (用于查找地盘星/门)
const ORIGINAL_XING = {
	1: "天蓬",
	8: "天任",
	3: "天冲",
	4: "天辅",
	9: "天英",
	2: "天芮",
	7: "天柱",
	6: "天心",
	5: "天禽",
}
const ORIGINAL_MEN = {
	1: "休",
	8: "生",
	3: "伤",
	4: "杜",
	9: "景",
	2: "死",
	7: "惊",
	6: "开",
}

// 排盘结果接口
export interface QiMenResult {
	diPan: Record<number, string> // 宫位 -> 干
	tianPan: Record<number, string> // 宫位 -> 干
	jiuXing: Record<number, string> // 宫位 -> 星
	baMen: Record<number, string> // 宫位 -> 门
	baShen: Record<number, string> // 宫位 -> 神
	meta: {
		xunShou: string // 旬首 (如 '甲子')
		zhiFu: string // 值符星
		zhiShi: string // 值使门
		shiGan: string // 时干
		kongWang: string // 空亡
	}
}

/**
 * 获取旬首
 * @param shiGan 时干
 * @param shiZhi 时支
 */
function getXunShou(shiGan: string, shiZhi: string): string {
	const ganIdx = TIAN_GAN.indexOf(shiGan)
	const zhiIdx = DI_ZHI.indexOf(shiZhi)
	const diff = (zhiIdx - ganIdx + 12) % 12
	// 甲子0, 甲戌10, 甲申8, 甲午6, 甲辰4, 甲寅2
	const liuren = {
		0: "甲子",
		10: "甲戌",
		8: "甲申",
		6: "甲午",
		4: "甲辰",
		2: "甲寅",
	}
	return (liuren as any)[diff] || "甲子"
}

/**
 * 获取六仪对应的旬首干 (如 戊->甲子)
 */
function getLiuYiByXunShou(xunShou: string): string {
	const map: Record<string, string> = {
		甲子: "戊",
		甲戌: "己",
		甲申: "庚",
		甲午: "辛",
		甲辰: "壬",
		甲寅: "癸",
	}
	return map[xunShou] || "戊"
}

/**
 * 奇门排盘主函数
 */
export function runQiMen(
	style: PanStyle,
	dunType: DunType,
	juNum: number,
	shiGan: string,
	shiZhi: string
): QiMenResult {
	// 1. 排地盘
	const diPan = layoutDiPan(dunType, juNum)

	// 2. 确定旬首、值符、值使
	const xunShou = getXunShou(shiGan, shiZhi)
	const xunShouGan = getLiuYiByXunShou(xunShou) // 旬首落地的干 (如 甲子->戊)

	// 找旬首在地盘的宫位
	let zhiFuGong = 0
	for (let gong = 1; gong <= 9; gong++) {
		if (diPan[gong] === xunShouGan) {
			zhiFuGong = gong
			break
		}
	}
	if (zhiFuGong === 5) zhiFuGong = 2 // 寄宫：中5寄坤2 (转盘通常寄坤)

	const zhiFuXing = ORIGINAL_XING[zhiFuGong as keyof typeof ORIGINAL_XING]
	const zhiShiMen = ORIGINAL_MEN[zhiFuGong as keyof typeof ORIGINAL_MEN] || "死" // 中5寄坤2死门

	// 3. 排天盘
	// 值符随时干：即旬首(值符)加在时干的位置
	// 找时干在地盘的位置
	let shiGanGong = 0
	for (let gong = 1; gong <= 9; gong++) {
		if (diPan[gong] === shiGan) {
			shiGanGong = gong
			break
		}
	}
	// 如果时干在5宫，寄2宫 (转盘)
	// 飞盘时干在5宫则在5宫
	if (style === "zhuan" && shiGanGong === 5) shiGanGong = 2

	// 此时：值符星(zhiFuXing) 要飞/转到 时干所在宫(shiGanGong)
	// 天盘排布：根据地盘和旋转偏移
	const tianPan = layoutTianPan(style, diPan, zhiFuGong, shiGanGong)

	// 4. 排九星
	const jiuXing = layoutJiuXing(style, zhiFuXing, shiGanGong)

	// 5. 排八门
	// 值使随时宫
	// 阳遁：值使宫 = 值符宫 + (时支序号 - 旬首时支序号)
	// 阴遁：值使宫 = 值符宫 - (时支序号 - 旬首时支序号)
	// 需处理九宫循环
	const baMen = layoutBaMen(
		style,
		dunType,
		zhiShiMen,
		zhiFuGong,
		shiZhi,
		xunShou
	)

	// 6. 排八神
	const baShen = layoutBaShen(style, dunType, shiGanGong)

	return {
		diPan,
		tianPan,
		jiuXing,
		baMen,
		baShen,
		meta: {
			xunShou,
			zhiFu: zhiFuXing,
			zhiShi: zhiShiMen,
			shiGan,
			kongWang: getKongWang(shiGan, shiZhi),
		},
	}
}

function layoutDiPan(dunType: DunType, juNum: number): Record<number, string> {
	const result: Record<number, string> = {}
	const seq = SAN_QI_LIU_YI
	// 阳遁顺排，阴遁逆排
	// 戊从 juNum 开始
	for (let i = 0; i < 9; i++) {
		let gong = 0
		if (dunType === "yang") {
			gong = ((juNum + i - 1) % 9) + 1
		} else {
			gong = ((juNum - i - 1 + 9) % 9) + 1 // +9防止负数
			if (gong === 0) gong = 9
		}
		result[gong] = seq[i]
	}
	return result
}

function layoutTianPan(
	style: PanStyle,
	diPan: Record<number, string>,
	fromGong: number, // 旬首在地盘位置
	toGong: number // 时干在地盘位置
): Record<number, string> {
	const result: Record<number, string> = {}

	if (style === "zhuan") {
		// 转盘法：
		// 宫位顺序：1->8->3->4->9->2->7->6->1
		const path = [1, 8, 3, 4, 9, 2, 7, 6]
		const fromIdx = path.indexOf(fromGong)
		const toIdx = path.indexOf(toGong)

		const offset = (toIdx - fromIdx + 8) % 8

		path.forEach((gong, i) => {
			// 原来的宫位
			const originalGong = path[(i - offset + 8) % 8]
			// 该宫位的地盘干，跑到当前gong的天盘上
			result[gong] = diPan[originalGong]
		})

		// 中宫天盘通常是寄宫的干
		result[5] = result[2]
	} else {
		// 飞盘法：
		// 宫位顺序：1->2->3->4->5->6->7->8->9
		const path = [1, 2, 3, 4, 5, 6, 7, 8, 9]
		// 飞盘中 fromGong, toGong 可以是 5
		const fromIdx = path.indexOf(fromGong)
		const toIdx = path.indexOf(toGong)

		const offset = (toIdx - fromIdx + 9) % 9

		path.forEach((gong, i) => {
			// 原来的宫位
			const originalGong = path[(i - offset + 9) % 9]
			// 该宫位的地盘干，跑到当前gong的天盘上
			result[gong] = diPan[originalGong]
		})
	}

	return result
}

function layoutJiuXing(
	style: PanStyle,
	zhiFuXing: string,
	toGong: number
): Record<number, string> {
	const result: Record<number, string> = {}
	const stars = ["天蓬", "天任", "天冲", "天辅", "天英", "天芮", "天柱", "天心"]
	// 天禽星通常寄天芮(坤2)

	if (style === "zhuan") {
		const path = [1, 8, 3, 4, 9, 2, 7, 6]
		// 找到值符星在stars中的位置（对应原始宫位）
		// 值符星 -> 落入 toGong
		// 先找值符星原始宫位
		let originalGong = 1
		for (const [g, s] of Object.entries(ORIGINAL_XING)) {
			if (s === zhiFuXing) {
				originalGong = parseInt(g)
				break
			}
		}
		if (originalGong === 5) originalGong = 2 // 天禽寄天芮

		const fromIdx = path.indexOf(originalGong)
		const toIdx = path.indexOf(toGong)
		const offset = (toIdx - fromIdx + 8) % 8

		path.forEach((gong, i) => {
			const srcGong = path[(i - offset + 8) % 8]
			// 原宫位的星
			let star = ORIGINAL_XING[srcGong as keyof typeof ORIGINAL_XING]
			if (srcGong === 2) star = "天芮" // 简化显示，天禽暂略
			result[gong] = star
		})
		result[5] = "" // 中宫无星
	} else {
		// 飞盘：九星顺飞九宫 (1->2->3->4->5->6->7->8->9)
		// 原始位置：
		// 1蓬, 2芮, 3冲, 4辅, 5禽, 6心, 7柱, 8任, 9英
		// 注意：通常飞盘奇门的星序可能略有不同，此处按洛书数序排
		const starsInOrder = [
			{ g: 1, n: "天蓬" },
			{ g: 2, n: "天芮" },
			{ g: 3, n: "天冲" },
			{ g: 4, n: "天辅" },
			{ g: 5, n: "天禽" },
			{ g: 6, n: "天心" },
			{ g: 7, n: "天柱" },
			{ g: 8, n: "天任" },
			{ g: 9, n: "天英" },
		]

		// 找值符星的原始宫位
		let originalGong = 1
		for (const s of starsInOrder) {
			if (s.n === zhiFuXing) {
				originalGong = s.g
				break
			}
		}

		// 偏移量 calculation
		// 飞盘通常顺飞：
		// newGong = (originalGong + offset - 1) % 9 + 1
		// toGong = (originalGong + offset - 1) % 9 + 1
		// => offset = toGong - originalGong

		let offset = toGong - originalGong
		if (offset < 0) offset += 9

		starsInOrder.forEach((s) => {
			const newGong = ((s.g + offset - 1) % 9) + 1
			result[newGong] = s.n
		})
	}

	return result
}

function layoutBaMen(
	style: PanStyle,
	dunType: DunType,
	zhiShiMen: string,
	zhiFuGong: number,
	shiZhi: string,
	xunShou: string
): Record<number, string> {
	const result: Record<number, string> = {}

	// 1. 确定值使落宫
	// 时支序数 - 旬首序数
	const zhiIdx = DI_ZHI.indexOf(shiZhi)
	const xunIdx = DI_ZHI.indexOf(xunShou.slice(1)) // 子/戌/申...
	let diff = zhiIdx - xunIdx
	if (diff < 0) diff += 12

	let zhiShiGong = 0
	if (dunType === "yang") {
		// 阳遁顺飞
		// 按照 1,2,3,4,5,6,7,8,9 顺序
		// 值符宫 + diff
		zhiShiGong = ((zhiFuGong + diff - 1) % 9) + 1
	} else {
		// 阴遁逆飞
		// 值符宫 - diff
		zhiShiGong = ((zhiFuGong - diff - 1 + 9) % 9) + 1
		if (zhiShiGong <= 0) zhiShiGong += 9
	}

	if (style === "zhuan") {
		// 八门排布顺序：坎1->艮8->震3->巽4->离9->坤2->兑7->乾6
		const path = [1, 8, 3, 4, 9, 2, 7, 6]
		// 找到值使门原始宫位
		let originalGong = 1
		for (const [g, m] of Object.entries(ORIGINAL_MEN)) {
			if (m === zhiShiMen) {
				originalGong = parseInt(g)
				break
			}
		}
		if (originalGong === 5) originalGong = 2 // 死门寄2

		const fromIdx = path.indexOf(originalGong)
		// 目标宫位如果是5，寄2
		if (zhiShiGong === 5) zhiShiGong = 2

		const toIdx = path.indexOf(zhiShiGong)
		const offset = (toIdx - fromIdx + 8) % 8

		path.forEach((gong, i) => {
			const srcGong = path[(i - offset + 8) % 8]
			result[gong] = ORIGINAL_MEN[srcGong as keyof typeof ORIGINAL_MEN]
		})
		result[5] = ""
	} else {
		// 飞盘八门：通常也是顺飞九宫 (1->2->3->4->5->6->7->8->9)
		// 但只有8个门，中5通常不排门或重复？
		// 飞盘流派众多，此处采用：八门顺飞九宫，遇中5跳过或寄宫
		// 简单处理：跳过中5，即路径为 1,2,3,4,6,7,8,9

		const path = [1, 2, 3, 4, 6, 7, 8, 9]

		// 找原始宫位
		let originalGong = 1
		for (const [g, m] of Object.entries(ORIGINAL_MEN)) {
			if (m === zhiShiMen) {
				originalGong = parseInt(g)
				break
			}
		}
		// 如果值使本来就在5(几乎不可能，原始门都在四周)，设为2
		if (originalGong === 5) originalGong = 2

		// 目标 zhiShiGong 如果是 5，飞盘通常入中吗？
		// 飞盘值使入中通常意味着什么？
		// 简化：若入中，则寄2 (与转盘类似处理，防止空缺)
		if (zhiShiGong === 5) zhiShiGong = 2

		const fromIdx = path.indexOf(originalGong)
		let toIdx = path.indexOf(zhiShiGong)
		if (toIdx === -1) toIdx = path.indexOf(2) // Fallback

		const offset = (toIdx - fromIdx + 8) % 8

		path.forEach((gong, i) => {
			const srcGong = path[(i - offset + 8) % 8]
			result[gong] = ORIGINAL_MEN[srcGong as keyof typeof ORIGINAL_MEN]
		})
		result[5] = ""
	}

	return result
}

function layoutBaShen(
	style: PanStyle,
	dunType: DunType,
	zhiFuGong: number
): Record<number, string> {
	const result: Record<number, string> = {}

	if (style === "zhuan") {
		const path = [1, 8, 3, 4, 9, 2, 7, 6]
		// 值符落 zhiFuGong (天盘值符宫，即时干宫)
		if (zhiFuGong === 5) zhiFuGong = 2
		const startIdx = path.indexOf(zhiFuGong)

		// 阳遁顺排，阴遁逆排
		const gods = BA_SHEN_ZHUAN

		path.forEach((gong, i) => {
			// 计算当前gong相对于startIdx的偏移
			// i 是当前遍历到的盘面位置索引
			// 我们需要知道它是第几个神
			// 阳遁：神序与盘序同向
			let godIdx = 0
			if (dunType === "yang") {
				godIdx = (i - startIdx + 8) % 8
			} else {
				// 阴遁：值符逆行？不，八神在盘上是逆时针排还是顺时针排？
				// 阳遁顺排：值符, 腾蛇...
				// 阴遁逆排：值符, 腾蛇... (在盘面上逆时针)
				// 即：如果 i 增加(顺时针)，godIdx 应该减少
				godIdx = (startIdx - i + 8) % 8
			}
			result[gong] = gods[godIdx]
		})
		result[5] = ""
	} else {
		// 飞盘八神：顺飞九宫 (1->2->...->9)
		// 常见神序：值符, 腾蛇, 太阴, 六合, 勾陈, 朱雀, 九地, 九天, 玄武 (9神)
		const gods = [
			"值符",
			"腾蛇",
			"太阴",
			"六合",
			"勾陈",
			"朱雀",
			"九地",
			"九天",
			"玄武",
		]

		// 值符落宫
		// 飞盘值符落宫即天盘值符所在宫位
		// 阳遁顺飞，阴遁逆飞

		const startGong = zhiFuGong
		// startGong 是 1-9

		for (let i = 0; i < 9; i++) {
			// i is index of god (0=值符)
			const god = gods[i]

			let targetGong = 0
			if (dunType === "yang") {
				// 顺飞: start + i
				targetGong = ((startGong + i - 1) % 9) + 1
			} else {
				// 逆飞: start - i
				targetGong = ((startGong - i - 1 + 9) % 9) + 1
			}

			result[targetGong] = god
		}
	}
	return result
}

function getKongWang(shiGan: string, shiZhi: string): string {
	const xun = getXunShou(shiGan, shiZhi)
	const map: Record<string, string> = {
		甲子: "戌亥",
		甲戌: "申酉",
		甲申: "午未",
		甲午: "辰巳",
		甲辰: "寅卯",
		甲寅: "子丑",
	}
	return map[xun] || ""
}

// 辅助：获取Grid显示数据
export function getGridData(
	result: QiMenResult
): Array<{ cellId: string; qimen: any }> {
	const cells = []
	for (let i = 0; i < 9; i++) {
		const gong = GRID_TO_GONG[i]
		const row = Math.floor(i / 3)
		const col = i % 3
		cells.push({
			cellId: `cell-${row}-${col}`,
			qimen: {
				diPan: result.diPan[gong],
				tianPan: result.tianPan[gong],
				baMen: result.baMen[gong],
				jiuXing: result.jiuXing[gong],
				baShen: result.baShen[gong],
				gong: `${gong}`,
			},
		})
	}
	return cells
}
