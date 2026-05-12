export interface ThemeOption {
  value: string
  label: string
  occasion: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  // 温柔通勤
  { value: 'polished-light-commute', label: '轻正式通勤', occasion: 'workday' },
  { value: 'urban-minimal-foundation', label: '都市极简基础', occasion: 'workday' },
  { value: 'soft-tone-lift', label: '柔调提亮', occasion: 'workday' },
  { value: 'mist-cool-commute', label: '雾冷调通勤', occasion: 'workday' },
  { value: 'warm-grounded-commute', label: '暖调沉稳通勤', occasion: 'workday' },
  // 周末约会
  { value: 'city-weekend-soft', label: '城市周末柔和', occasion: 'city-weekend' },
  { value: 'date-evening-glow', label: '约会暮光', occasion: 'city-weekend' },
  { value: 'playful-pop-weekend', label: '趣味波普周末', occasion: 'city-weekend' },
  { value: 'relaxed-denim-weekend', label: '休闲牛仔周末', occasion: 'city-weekend' },
  // 清风户外
  { value: 'holiday-sunlit-escape', label: '假日阳光逃逸', occasion: 'holiday-outing' },
  { value: 'nature-earth-walk', label: '自然大地漫步', occasion: 'holiday-outing' },
  { value: 'coastal-breeze-holiday', label: '海风假日', occasion: 'holiday-outing' },
  { value: 'adventure-sport-outdoor', label: '探险运动户外', occasion: 'holiday-outing' },
  // 晚宴流光
  { value: 'light-social-glow', label: '社交微光', occasion: 'light-social' },
  { value: 'elegant-dinner-luxe', label: '优雅晚宴奢华', occasion: 'light-social' },
  { value: 'moody-evening-drama', label: '暗调晚宴戏剧感', occasion: 'light-social' },
  { value: 'minimalist-evening', label: '极简晚宴', occasion: 'light-social' },
]

export const THEME_LABEL_MAP: Record<string, string> = Object.fromEntries(
  THEME_OPTIONS.map((t) => [t.value, t.label]),
)
