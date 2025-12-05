export type DunType = "yang" | "yin"
export interface DunJu {
  type: DunType
  num: number
}

const diBaseValues = [
  "wu",
  "ji",
  "geng",
  "xin",
  "ren",
  "gui",
  "ding",
  "bing",
  "yi",
]

const menBaseValues = [
  "xiu",
  "sheng",
  "shang",
  "du",
  "jing",
  "si",
  "jing2",
  "kai",
]

const starBaseValues = [
  "tianpeng",
  "tianren",
  "tianchong",
  "tianfu",
  "tianying",
  "tianrui",
  "tianzhu",
  "tianxin",
  "tianqin",
]

const godBaseValues = [
  "zhifu",
  "tengshe",
  "taiyin",
  "liuhe",
  "baihu",
  "xuanwu",
  "jiudi",
  "jiutian",
  "zhifu",
]

function rotate<T>(arr: T[], offset: number): T[] {
  const n = arr.length
  const off = ((offset % n) + n) % n
  return arr.map((_, i) => arr[(i + off) % n])
}

export function parseDunJu(value: string): DunJu {
  const isYang = value.startsWith("yang")
  const numStr = value.replace(/[^0-9]/g, "")
  const num = Math.max(1, Math.min(9, parseInt(numStr || "1", 10)))
  return { type: isYang ? "yang" : "yin", num }
}

export function inferDunByJieQi(date: Date, fallback: DunJu): DunJu {
  const m = date.getMonth() + 1
  const type: DunType = m >= 2 && m <= 7 ? "yang" : "yin"
  return { type, num: fallback.num }
}

export function computeLayout(date: Date, dunJu: DunJu) {
  const sign = dunJu.type === "yang" ? 1 : -1
  const offset = ((dunJu.num - 1) % 9) * sign

  const LO_SHU: number[] = [4, 9, 2, 3, 5, 7, 8, 1, 6]

  const diPalaceBase: string[] = [...diBaseValues]
  const tianPalace = rotate(diBaseValues, offset)
  const menPalaceBase: string[] = [
    ...menBaseValues,
    "kai",
  ]
  const menPalace = rotate(menPalaceBase, offset)
  const starPalace = rotate(starBaseValues, offset)
  const godPalaceBase: string[] = [
    ...godBaseValues.slice(0, 8),
    "zhifu",
  ]
  const godPalace = rotate(godPalaceBase, offset)

  const palaceToGrid = (valuesByPalace: string[]): string[] => {
    const grid: string[] = []
    for (let i = 0; i < 9; i++) {
      const palaceNum = LO_SHU[i]
      grid.push(valuesByPalace[palaceNum - 1])
    }
    return grid
  }

  return {
    diPan: palaceToGrid(diPalaceBase),
    tianPan: palaceToGrid(tianPalace),
    renPan: palaceToGrid(menPalace),
    jiuXing: palaceToGrid(starPalace),
    baShen: palaceToGrid(godPalace),
  }
}
