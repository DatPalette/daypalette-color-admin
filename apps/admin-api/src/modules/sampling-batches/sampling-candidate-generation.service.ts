import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type {
  SamplingBatchDocument,
  SamplingCandidateGenerationCapabilities,
  SamplingBatchSummary,
  SamplingRecord,
} from '@daypalette-color-admin/contracts';
import type { GenerateSamplingCandidatesDto } from './dto/generate-sampling-candidates.dto';

type CandidateGenerationMode = NonNullable<
  GenerateSamplingCandidatesDto['mode']
>;
type SamplingBatchGenerationSummaryMetrics = Pick<
  SamplingBatchSummary,
  | 'remainingVisibleUniqueCapacity'
  | 'visibleUniqueCapacity'
  | 'visibleUniqueCount'
>;

interface BrandCandidateProfile {
  brandName: string;
  categoryFocus: string[];
  marketSignal: string;
  siteUrl: string;
  styleSignals: string[];
  themeKeys: string[];
}

interface ThemeCandidateProfile {
  accentColorSummary: string;
  colorSummary: string[];
  marketSignal: string;
  primaryColorSummary: string;
  reviewCue: string;
  secondaryColorSummary: string;
}

interface ModelCandidateEnhancement {
  accentColorSummary?: string;
  colorSummary?: string[];
  marketSignals?: string;
  notesSuffix?: string;
  primaryColorSummary?: string;
  samplingId: string;
  secondaryColorSummary?: string;
}

interface PreparedGenerationRecordOptions {
  index: number;
  itemCategory: string;
  occasionId: string;
  productionBatchId: string;
  samplingId: string;
  sourceWhitelistIds: string[];
  themeKey: string;
  themeLabelZh: string;
}

interface ThemeSyntheticPaletteBlueprint {
  accentBuckets: SemanticColorBucket[];
  primaryBuckets: SemanticColorBucket[];
  reviewFocus: string;
  secondaryBuckets: SemanticColorBucket[];
}

const semanticColorBucketPresets = [
  {
    bucket: 'light-neutral',
    keywords: ['壳白', '米白', '奶白', '乳白', '象牙白', '暖白', '白'],
  },
  {
    bucket: 'mist-blue',
    keywords: ['雾蓝', '灰蓝', '雾灰蓝', '蓝灰', 'steel blue', 'mist blue'],
  },
  {
    bucket: 'beige',
    keywords: [
      '浅卡其',
      '卡其',
      '沙色',
      '燕麦',
      '驼',
      'camel',
      'khaki',
      'beige',
    ],
  },
  {
    bucket: 'gray',
    keywords: ['炭灰', '深灰', '石墨', 'charcoal', 'graphite', '灰'],
  },
  {
    bucket: 'navy',
    keywords: ['藏蓝', '海军蓝', 'navy'],
  },
  {
    bucket: 'olive',
    keywords: ['橄榄', '鼠尾草', 'sage', '军绿', '苔绿', 'olive'],
  },
  {
    bucket: 'brown',
    keywords: ['咖', '棕', '可可', 'brown', 'mocha'],
  },
  {
    bucket: 'rust',
    keywords: ['砖红', '赤陶', 'terracotta', 'rust'],
  },
] as const;

type SemanticColorBucket =
  (typeof semanticColorBucketPresets)[number]['bucket'];

const semanticBucketLabelOptions: Record<SemanticColorBucket, string[]> = {
  beige: [
    '浅卡其',
    '燕麦驼',
    '沙色卡其',
    '灰卡其',
    '奶驼',
    '暖燕麦',
    '浅驼',
    '柔卡其',
  ],
  brown: [
    '焦糖棕',
    '可可棕',
    '栗棕',
    '深焦糖棕',
    '橡木棕',
    '摩卡棕',
    '暖咖棕',
    '榛棕',
  ],
  gray: [
    '石墨灰',
    '深岩灰',
    '铅墨灰',
    '冷石墨',
    '板岩灰',
    '铁灰',
    '深雾灰',
    '烟炭灰',
  ],
  'light-neutral': [
    '壳白',
    '云雾白',
    '雾米白',
    '珍珠白',
    '暖壳白',
    '奶雾白',
    '冰米白',
    '霜白',
  ],
  'mist-blue': [
    '雾灰蓝',
    '钢蓝灰',
    '冷雾蓝',
    '浅钢蓝',
    '薄雾蓝',
    '烟灰蓝',
    '海雾蓝',
    '银雾蓝',
  ],
  navy: [
    '墨海军蓝',
    '深海军蓝',
    '冷海军蓝',
    '雾海军蓝',
    '藏蓝黑',
    '夜海军蓝',
    '深藏蓝',
    '岩海军蓝',
  ],
  olive: [
    '浅橄榄灰',
    '鼠尾草灰',
    '苔绿灰',
    '橄榄雾灰',
    '雾橄榄',
    '冷橄榄灰',
    '浅鼠尾草',
    '苔雾绿',
  ],
  rust: [
    '暖砖红',
    '茶砖红',
    '深砖红',
    '浅砖红',
    '雾砖红',
    '赤陶红',
    '暖赤陶',
    '赤陶砖红',
  ],
};

const themeSyntheticPaletteBlueprints: Record<
  string,
  ThemeSyntheticPaletteBlueprint
> = {
  'artful-brunch-weekend': {
    accentBuckets: ['olive', 'mist-blue', 'brown', 'gray'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '艺感周末层次',
    secondaryBuckets: ['mist-blue', 'light-neutral', 'olive', 'beige'],
  },
  'city-gallery-weekend': {
    accentBuckets: ['navy', 'gray', 'olive', 'brown'],
    primaryBuckets: ['light-neutral', 'mist-blue', 'gray'],
    reviewFocus: '城市周末秩序',
    secondaryBuckets: ['mist-blue', 'gray', 'light-neutral', 'beige'],
  },
  'holiday-market-stroll': {
    accentBuckets: ['brown', 'rust', 'olive', 'gray'],
    primaryBuckets: ['beige', 'light-neutral', 'mist-blue'],
    reviewFocus: '假日市集松弛层次',
    secondaryBuckets: ['beige', 'brown', 'olive', 'mist-blue'],
  },
  'holiday-postcard-evening': {
    accentBuckets: ['rust', 'navy', 'brown', 'gray'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '假日晚风层次',
    secondaryBuckets: ['mist-blue', 'beige', 'brown', 'gray'],
  },
  'holiday-sunlit-escape': {
    accentBuckets: ['olive', 'mist-blue', 'beige', 'gray'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '晴光出游通透层次',
    secondaryBuckets: ['mist-blue', 'light-neutral', 'olive', 'beige'],
  },
  'holiday-trail-soft-outing': {
    accentBuckets: ['rust', 'olive', 'brown', 'gray'],
    primaryBuckets: ['beige', 'light-neutral', 'olive'],
    reviewFocus: '自然系出游层次',
    secondaryBuckets: ['olive', 'beige', 'brown', 'light-neutral'],
  },
  'light-social-glow': {
    accentBuckets: ['rust', 'brown', 'gray', 'mist-blue'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '轻社交提气层次',
    secondaryBuckets: ['beige', 'mist-blue', 'brown', 'gray'],
  },
  'light-social-modern-romance': {
    accentBuckets: ['gray', 'brown', 'rust', 'olive'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '现代柔美层次',
    secondaryBuckets: ['beige', 'brown', 'mist-blue', 'light-neutral'],
  },
  'light-social-night-navy': {
    accentBuckets: ['navy', 'gray', 'brown', 'rust'],
    primaryBuckets: ['light-neutral', 'mist-blue', 'beige'],
    reviewFocus: '夜蓝精致层次',
    secondaryBuckets: ['mist-blue', 'gray', 'beige', 'light-neutral'],
  },
  'light-social-polished-dinner': {
    accentBuckets: ['navy', 'brown', 'gray', 'rust'],
    primaryBuckets: ['light-neutral', 'mist-blue', 'beige'],
    reviewFocus: '精致晚餐层次',
    secondaryBuckets: ['mist-blue', 'gray', 'beige', 'light-neutral'],
  },
  'light-social-sage-polish': {
    accentBuckets: ['olive', 'brown', 'gray', 'rust'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '鼠尾草雅致层次',
    secondaryBuckets: ['olive', 'beige', 'mist-blue', 'brown'],
  },
  'mist-cool-commute': {
    accentBuckets: ['gray', 'navy', 'olive', 'brown'],
    primaryBuckets: ['mist-blue', 'light-neutral', 'gray'],
    reviewFocus: '冷静通勤层次',
    secondaryBuckets: ['light-neutral', 'gray', 'navy', 'beige'],
  },
  'polished-light-commute': {
    accentBuckets: ['beige', 'gray', 'navy', 'olive', 'brown'],
    primaryBuckets: ['light-neutral', 'mist-blue', 'beige'],
    reviewFocus: '轻正式通勤秩序',
    secondaryBuckets: ['mist-blue', 'light-neutral', 'beige', 'gray', 'olive'],
  },
  'soft-tone-lift': {
    accentBuckets: ['brown', 'rust', 'gray', 'olive'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '柔和提气通勤平衡',
    secondaryBuckets: ['rust', 'beige', 'brown', 'mist-blue'],
  },
  'soft-date-weekend': {
    accentBuckets: ['brown', 'rust', 'gray', 'olive'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '柔和约会周末层次',
    secondaryBuckets: ['rust', 'beige', 'brown', 'mist-blue'],
  },
  'sunset-cafe-weekend': {
    accentBuckets: ['brown', 'navy', 'rust', 'gray'],
    primaryBuckets: ['light-neutral', 'beige', 'mist-blue'],
    reviewFocus: '日落咖啡周末层次',
    secondaryBuckets: ['mist-blue', 'beige', 'brown', 'gray'],
  },
  'urban-casual-denim': {
    accentBuckets: ['navy', 'gray', 'olive', 'brown'],
    primaryBuckets: ['light-neutral', 'mist-blue', 'beige'],
    reviewFocus: '都市休闲牛仔层次',
    secondaryBuckets: ['mist-blue', 'light-neutral', 'gray', 'beige'],
  },
  'urban-minimal-foundation': {
    accentBuckets: ['navy', 'gray', 'olive', 'brown'],
    primaryBuckets: ['light-neutral', 'gray', 'mist-blue'],
    reviewFocus: '都市极简边界',
    secondaryBuckets: ['gray', 'navy', 'mist-blue', 'light-neutral'],
  },
  'warm-grounded-commute': {
    accentBuckets: ['rust', 'brown', 'olive', 'gray', 'light-neutral'],
    primaryBuckets: ['beige', 'brown', 'light-neutral'],
    reviewFocus: '暖稳通勤分量',
    secondaryBuckets: ['brown', 'gray', 'olive', 'rust'],
  },
  'warm-market-weekend': {
    accentBuckets: ['brown', 'rust', 'olive', 'gray'],
    primaryBuckets: ['beige', 'light-neutral', 'brown'],
    reviewFocus: '暖调周末松弛层次',
    secondaryBuckets: ['beige', 'brown', 'mist-blue', 'olive'],
  },
};

const categorySearchTerms: Record<string, { en: string; zh: string }> = {
  blazer: { en: 'women blazer', zh: '女装 西装外套' },
  blouse: { en: 'women blouse', zh: '女装 衬衫' },
  cardigan: { en: 'women cardigan', zh: '女装 开衫' },
  coat: { en: 'women coat', zh: '女装 大衣' },
  dress: { en: 'women dress', zh: '女装 连衣裙' },
  knitwear: { en: 'women knitwear', zh: '女装 针织' },
  shirt: { en: 'women shirt', zh: '女装 衬衫' },
  skirt: { en: 'women skirt', zh: '女装 半裙' },
  trench: { en: 'women trench coat', zh: '女装 风衣' },
  trousers: { en: 'women trousers', zh: '女装 西裤' },
};

const defaultThemeLabelMap: Record<string, string> = {
  'artful-brunch-weekend': '艺感早午餐周末',
  'city-gallery-weekend': '城市画廊周末',
  'holiday-market-stroll': '假日市集漫游',
  'holiday-postcard-evening': '假日晚风明信片',
  'holiday-sunlit-escape': '晴光出游假日',
  'holiday-trail-soft-outing': '轻徒步柔和出游',
  'light-social-glow': '轻社交微光提气',
  'light-social-modern-romance': '轻社交现代柔美',
  'light-social-night-navy': '轻社交夜蓝精致',
  'light-social-polished-dinner': '轻社交精致晚餐',
  'light-social-sage-polish': '轻社交鼠尾草雅致',
  'light-social-soft-plum': '轻社交雾紫提气',
  'mist-cool-commute': '雾感冷静通勤',
  'polished-light-commute': '轻正式通勤',
  'soft-tone-lift': '柔和提气通勤',
  'soft-date-weekend': '柔和约会周末',
  'sunset-cafe-weekend': '日落咖啡周末',
  'urban-casual-denim': '都市休闲牛仔',
  'urban-minimal-foundation': '都市极简基底',
  'warm-grounded-commute': '暖稳秋冬通勤',
  'warm-market-weekend': '暖调市集周末',
};

const occasionCategoryMatrix: Record<string, string[]> = {
  'city-weekend': [
    'shirt',
    'cardigan',
    'blouse',
    'knitwear',
    'skirt',
    'trousers',
    'dress',
    'coat',
  ],
  'holiday-outing': [
    'dress',
    'shirt',
    'cardigan',
    'trousers',
    'skirt',
    'coat',
    'trench',
    'blouse',
  ],
  'light-social': [
    'blouse',
    'dress',
    'skirt',
    'cardigan',
    'knitwear',
    'blazer',
    'shirt',
    'trousers',
  ],
  workday: [
    'blazer',
    'shirt',
    'cardigan',
    'coat',
    'dress',
    'knitwear',
    'skirt',
    'trench',
    'trousers',
    'blouse',
  ],
};

const seasonalHintByCategory: Record<string, string> = {
  blazer: 'spring',
  blouse: 'spring',
  cardigan: 'autumn',
  coat: 'winter',
  dress: 'spring',
  knitwear: 'winter',
  shirt: 'spring',
  skirt: 'spring',
  trench: 'autumn',
  trousers: 'all',
};

const themeCandidateProfiles: Record<string, ThemeCandidateProfile> = {
  'artful-brunch-weekend': {
    accentColorSummary: '浅橄榄灰',
    colorSummary: ['壳白', '薄雾蓝', '浅橄榄灰'],
    marketSignal:
      '城市周末的早午餐与展览场景适合明净浅中性叠一点雾蓝和浅橄榄，既松弛又显得有品味。',
    primaryColorSummary: '壳白',
    reviewCue: '壳白、薄雾蓝与浅橄榄灰的艺感周末层次',
    secondaryColorSummary: '薄雾蓝',
  },
  'city-gallery-weekend': {
    accentColorSummary: '深板岩蓝',
    colorSummary: ['云雾白', '钢蓝灰', '深板岩蓝'],
    marketSignal:
      '城市周末的画廊和商场出行仍然偏爱灰蓝与深板岩蓝，气质比工作日更松，但不宜过甜。',
    primaryColorSummary: '云雾白',
    reviewCue: '云雾白、钢蓝灰与深板岩蓝的城市周末秩序',
    secondaryColorSummary: '钢蓝灰',
  },
  'holiday-market-stroll': {
    accentColorSummary: '焦糖棕',
    colorSummary: ['奶油米', '浅卡其', '焦糖棕'],
    marketSignal:
      '假日城市漫游更适合奶油米、浅卡其和焦糖棕这类温暖但不过重的旅行中性色。',
    primaryColorSummary: '奶油米',
    reviewCue: '奶油米、浅卡其与焦糖棕的假日松弛关系',
    secondaryColorSummary: '浅卡其',
  },
  'holiday-postcard-evening': {
    accentColorSummary: '暖砖红',
    colorSummary: ['珍珠白', '烟灰蓝', '暖砖红'],
    marketSignal:
      '假日傍晚与城市旅行晚风场景更适合珍珠白、烟灰蓝与暖砖红这种低饱和明信片色路。',
    primaryColorSummary: '珍珠白',
    reviewCue: '珍珠白、烟灰蓝与暖砖红的假日晚风层次',
    secondaryColorSummary: '烟灰蓝',
  },
  'holiday-sunlit-escape': {
    accentColorSummary: '鼠尾草灰',
    colorSummary: ['暖壳白', '浅雾蓝', '鼠尾草灰'],
    marketSignal:
      '晴光出游场景适合暖白、浅雾蓝和鼠尾草灰，让轻旅行服饰看起来更干净透气。',
    primaryColorSummary: '暖壳白',
    reviewCue: '暖壳白、浅雾蓝与鼠尾草灰的晴光出游清透感',
    secondaryColorSummary: '浅雾蓝',
  },
  'holiday-trail-soft-outing': {
    accentColorSummary: '暖砖红',
    colorSummary: ['燕麦驼', '雾橄榄', '暖砖红'],
    marketSignal:
      '轻徒步和假日散步更适合燕麦驼、雾橄榄和暖砖红这种自然系低饱和组合。',
    primaryColorSummary: '燕麦驼',
    reviewCue: '燕麦驼、雾橄榄与暖砖红的自然系出游层次',
    secondaryColorSummary: '雾橄榄',
  },
  'light-social-glow': {
    accentColorSummary: '豆沙粉',
    colorSummary: ['奶雾白', '雾粉杏', '豆沙粉'],
    marketSignal:
      '轻社交场景需要一点提气，但仍以低饱和豆沙、雾粉杏和奶白为主，避免甜腻。',
    primaryColorSummary: '奶雾白',
    reviewCue: '奶雾白、雾粉杏与豆沙粉的轻社交提气感',
    secondaryColorSummary: '雾粉杏',
  },
  'light-social-modern-romance': {
    accentColorSummary: '雾玫灰',
    colorSummary: ['柔米白', '浅藕粉', '雾玫灰'],
    marketSignal:
      '轻约会和朋友见面更适合把柔粉压进灰感，做成更成熟的现代柔美路线。',
    primaryColorSummary: '柔米白',
    reviewCue: '柔米白、浅藕粉与雾玫灰的现代柔美关系',
    secondaryColorSummary: '浅藕粉',
  },
  'light-social-night-navy': {
    accentColorSummary: '墨海军蓝',
    colorSummary: ['云雾白', '雾灰蓝', '墨海军蓝'],
    marketSignal:
      '轻社交的夜间精致路线适合用云雾白、雾灰蓝和墨海军蓝保持克制的存在感。',
    primaryColorSummary: '云雾白',
    reviewCue: '云雾白、雾灰蓝与墨海军蓝的夜蓝精致关系',
    secondaryColorSummary: '雾灰蓝',
  },
  'light-social-polished-dinner': {
    accentColorSummary: '李紫灰',
    colorSummary: ['珍珠白', '烟灰蓝', '李紫灰'],
    marketSignal:
      '轻晚餐和轻社交不一定都是粉色，珍珠白、烟灰蓝与李紫灰能把精致感拉出来。',
    primaryColorSummary: '珍珠白',
    reviewCue: '珍珠白、烟灰蓝与李紫灰的精致晚餐层次',
    secondaryColorSummary: '烟灰蓝',
  },
  'light-social-sage-polish': {
    accentColorSummary: '鼠尾草灰',
    colorSummary: ['奶油白', '浅卡其', '鼠尾草灰'],
    marketSignal:
      '轻社交并不总靠粉调，奶油白、浅卡其和鼠尾草灰更适合偏克制的雅致路线。',
    primaryColorSummary: '奶油白',
    reviewCue: '奶油白、浅卡其与鼠尾草灰的雅致轻社交层次',
    secondaryColorSummary: '浅卡其',
  },
  'mist-cool-commute': {
    accentColorSummary: '石墨灰',
    colorSummary: ['雾蓝灰', '冷米色', '石墨灰'],
    marketSignal:
      '冷静通勤女装更适合蓝灰、雾绿、石色这类低饱和冷静路线，重点是克制而不沉闷。',
    primaryColorSummary: '雾蓝灰',
    reviewCue: '雾蓝灰、冷米色与深稳压舱色之间的层次关系',
    secondaryColorSummary: '冷米色',
  },
  'polished-light-commute': {
    accentColorSummary: '浅卡其',
    colorSummary: ['壳白', '雾灰蓝', '浅卡其'],
    marketSignal:
      '轻正式通勤女装仍以低风险浅中性色为底，再用灰蓝或浅卡其拉开专业感与清爽度。',
    primaryColorSummary: '壳白',
    reviewCue: '壳白、灰蓝与浅卡其的轻正式主次',
    secondaryColorSummary: '雾灰蓝',
  },
  'soft-tone-lift': {
    accentColorSummary: '烟莓粉',
    colorSummary: ['奶杏白', '雾粉杏', '烟莓粉'],
    marketSignal:
      '女装提气路线更适合低饱和杏、雾粉、烟紫，不宜走高甜高亮的小女生方向。',
    primaryColorSummary: '奶杏白',
    reviewCue: '奶杏、雾粉与烟莓粉是否既提气又维持通勤感',
    secondaryColorSummary: '雾粉杏',
  },
  'urban-minimal-foundation': {
    accentColorSummary: '墨海军蓝',
    colorSummary: ['暖灰白', '石墨灰', '墨海军蓝'],
    marketSignal:
      '都市极简女装依然以灰白黑蓝为主，但更需要层次和材质变化，避免纯无彩堆叠。',
    primaryColorSummary: '暖灰白',
    reviewCue: '暖灰白、石墨灰与深蓝之间的克制层次',
    secondaryColorSummary: '石墨灰',
  },
  'warm-grounded-commute': {
    accentColorSummary: '暖酒红',
    colorSummary: ['燕麦驼', '炭棕灰', '暖酒红'],
    marketSignal:
      '暖稳秋冬通勤要用驼、棕、炭灰去建立分量感，再用暖酒红或深棕做小面积提气。',
    primaryColorSummary: '燕麦驼',
    reviewCue: '燕麦驼、炭棕灰与暖酒红的秋冬稳感平衡',
    secondaryColorSummary: '炭棕灰',
  },
  'soft-date-weekend': {
    accentColorSummary: '灰莓紫',
    colorSummary: ['奶杏白', '雾桃粉', '灰莓紫'],
    marketSignal:
      '周末约会和轻松见面更适合奶杏白、雾桃粉和灰莓紫这类不甜腻的柔和提气路线。',
    primaryColorSummary: '奶杏白',
    reviewCue: '奶杏白、雾桃粉与灰莓紫的周末约会温柔关系',
    secondaryColorSummary: '雾桃粉',
  },
  'sunset-cafe-weekend': {
    accentColorSummary: '暖咖棕',
    colorSummary: ['雾米白', '烟灰蓝', '暖咖棕'],
    marketSignal:
      '咖啡馆和傍晚周末场景适合雾米白、烟灰蓝与暖咖棕的成熟松弛路线。',
    primaryColorSummary: '雾米白',
    reviewCue: '雾米白、烟灰蓝与暖咖棕的傍晚咖啡馆层次',
    secondaryColorSummary: '烟灰蓝',
  },
  'urban-casual-denim': {
    accentColorSummary: '深海军蓝',
    colorSummary: ['云灰白', '浅雾蓝', '深海军蓝'],
    marketSignal: '城市休闲周末更常见白、浅雾蓝和深海军蓝的牛仔系低风险搭配。',
    primaryColorSummary: '云灰白',
    reviewCue: '云灰白、浅雾蓝与深海军蓝的都市休闲牛仔感',
    secondaryColorSummary: '浅雾蓝',
  },
  'warm-market-weekend': {
    accentColorSummary: '浅焦糖',
    colorSummary: ['奶油米', '柔卡其', '浅焦糖'],
    marketSignal:
      '市集和商场逛街场景常见奶油米、柔卡其和浅焦糖这种偏暖的城市周末组合。',
    primaryColorSummary: '奶油米',
    reviewCue: '奶油米、柔卡其与浅焦糖的暖调周末松弛感',
    secondaryColorSummary: '柔卡其',
  },
};

const themeCandidateProfileVariants: Record<string, ThemeCandidateProfile[]> = {
  'polished-light-commute': [
    themeCandidateProfiles['polished-light-commute']!,
    {
      accentColorSummary: '灰卡其',
      colorSummary: ['云雾白', '钢蓝灰', '灰卡其'],
      marketSignal:
        '轻正式衬衫与西装路线常用白、钢蓝灰、灰卡其做低风险专业层次，比纯黑白更适合女装通勤。',
      primaryColorSummary: '云雾白',
      reviewCue: '云雾白、钢蓝灰与灰卡其之间的轻商务秩序感',
      secondaryColorSummary: '钢蓝灰',
    },
    {
      accentColorSummary: '浅橄榄灰',
      colorSummary: ['米杏白', '淡雾蓝', '浅橄榄灰'],
      marketSignal:
        '轻正式路线也开始接受更柔和的灰绿点缀，但仍要保持白与蓝灰作主骨架。',
      primaryColorSummary: '米杏白',
      reviewCue: '米杏白、淡雾蓝和浅橄榄灰是否既松弛又专业',
      secondaryColorSummary: '淡雾蓝',
    },
    {
      accentColorSummary: '沙驼',
      colorSummary: ['霜白', '烟灰蓝', '沙驼'],
      marketSignal: '职场女装会用霜白和烟灰蓝维持清爽，再用沙驼把通勤感拉稳。',
      primaryColorSummary: '霜白',
      reviewCue: '霜白、烟灰蓝与沙驼的轻正式稳定度',
      secondaryColorSummary: '烟灰蓝',
    },
    {
      accentColorSummary: '浅焦糖',
      colorSummary: ['奶油米', '雾石蓝', '浅焦糖'],
      marketSignal:
        '轻正式并不总是冷感，奶油米和浅焦糖的组合更适合成熟通勤品牌。',
      primaryColorSummary: '奶油米',
      reviewCue: '奶油米、雾石蓝与浅焦糖的成熟轻商务平衡',
      secondaryColorSummary: '雾石蓝',
    },
    {
      accentColorSummary: '柔沙卡其',
      colorSummary: ['雾米白', '银蓝灰', '柔沙卡其'],
      marketSignal:
        '轻正式通勤也会用更柔和的米白、银蓝灰和沙卡其去拉开清爽层次，适合衬衫与薄西装。',
      primaryColorSummary: '雾米白',
      reviewCue: '雾米白、银蓝灰与柔沙卡其之间是否足够清爽且职业',
      secondaryColorSummary: '银蓝灰',
    },
    {
      accentColorSummary: '浅榛卡其',
      colorSummary: ['珍珠白', '冷雾蓝', '浅榛卡其'],
      marketSignal:
        '成熟通勤品牌会把珍珠白和冷雾蓝作为骨架，再用浅榛卡其把轻商务氛围压稳。',
      primaryColorSummary: '珍珠白',
      reviewCue: '珍珠白、冷雾蓝与浅榛卡其的稳定轻商务关系',
      secondaryColorSummary: '冷雾蓝',
    },
    {
      accentColorSummary: '淡驼灰',
      colorSummary: ['暖壳白', '雾钢蓝', '淡驼灰'],
      marketSignal:
        '轻正式路线会用暖壳白和雾钢蓝降低距离感，再以淡驼灰提升成熟感。',
      primaryColorSummary: '暖壳白',
      reviewCue: '暖壳白、雾钢蓝和淡驼灰是否形成柔和但不松散的秩序',
      secondaryColorSummary: '雾钢蓝',
    },
  ],
  'urban-minimal-foundation': [
    themeCandidateProfiles['urban-minimal-foundation']!,
    {
      accentColorSummary: '深板岩蓝',
      colorSummary: ['冷白灰', '铅灰', '深板岩蓝'],
      marketSignal:
        '极简路线更常见冷白灰加铅灰的基础，再用深板岩蓝代替纯黑增强层次。',
      primaryColorSummary: '冷白灰',
      reviewCue: '冷白灰、铅灰与深板岩蓝的都市压舱感',
      secondaryColorSummary: '铅灰',
    },
    {
      accentColorSummary: '深煤蓝',
      colorSummary: ['雾白', '烟炭灰', '深煤蓝'],
      marketSignal:
        '都市极简外套与裤装更常用雾白、烟炭灰和深煤蓝去保持利落但不生硬。',
      primaryColorSummary: '雾白',
      reviewCue: '雾白、烟炭灰和深煤蓝是否形成明确但不僵硬的对比',
      secondaryColorSummary: '烟炭灰',
    },
    {
      accentColorSummary: '墨绿灰',
      colorSummary: ['灰米白', '石板灰', '墨绿灰'],
      marketSignal:
        '都市极简也会用极低饱和绿灰替代海军蓝，尤其适合针织与外套组合。',
      primaryColorSummary: '灰米白',
      reviewCue: '灰米白、石板灰与墨绿灰的静态层次',
      secondaryColorSummary: '石板灰',
    },
    {
      accentColorSummary: '夜蓝黑',
      colorSummary: ['暖白灰', '深石墨', '夜蓝黑'],
      marketSignal:
        '高质感极简女装更偏向暖白灰和深石墨，再用夜蓝黑建立边界感。',
      primaryColorSummary: '暖白灰',
      reviewCue: '暖白灰、深石墨和夜蓝黑的高级低对比',
      secondaryColorSummary: '深石墨',
    },
    {
      accentColorSummary: '岩青灰',
      colorSummary: ['霜白灰', '深雾灰', '岩青灰'],
      marketSignal: '都市极简也会把青灰放进无彩基底里，让整体更冷静但不死板。',
      primaryColorSummary: '霜白灰',
      reviewCue: '霜白灰、深雾灰与岩青灰的安静层次',
      secondaryColorSummary: '深雾灰',
    },
    {
      accentColorSummary: '冷墨蓝',
      colorSummary: ['米灰白', '铅石灰', '冷墨蓝'],
      marketSignal:
        '女装极简通勤会用米灰白和铅石灰保持柔和，再用冷墨蓝补足边界感。',
      primaryColorSummary: '米灰白',
      reviewCue: '米灰白、铅石灰与冷墨蓝的低对比专业感',
      secondaryColorSummary: '铅石灰',
    },
    {
      accentColorSummary: '深松烟灰',
      colorSummary: ['云灰白', '铁灰', '深松烟灰'],
      marketSignal:
        '高频极简通勤会用云灰白和铁灰搭配更深一点的松烟灰，建立稳而不闷的基底。',
      primaryColorSummary: '云灰白',
      reviewCue: '云灰白、铁灰与深松烟灰是否兼顾干净和重量',
      secondaryColorSummary: '铁灰',
    },
  ],
  'soft-tone-lift': [
    themeCandidateProfiles['soft-tone-lift']!,
    {
      accentColorSummary: '豆沙粉',
      colorSummary: ['雾奶白', '浅杏粉', '豆沙粉'],
      marketSignal:
        '通勤提气路线更偏向豆沙和浅杏，而不是高甜樱粉，重点是低饱和与低对比。',
      primaryColorSummary: '雾奶白',
      reviewCue: '雾奶白、浅杏粉与豆沙粉是否提气但不过甜',
      secondaryColorSummary: '浅杏粉',
    },
    {
      accentColorSummary: '灰莓紫',
      colorSummary: ['壳杏白', '雾桃粉', '灰莓紫'],
      marketSignal: '更成熟的柔和提气路线会用灰莓紫替代亮粉，保留通勤气质。',
      primaryColorSummary: '壳杏白',
      reviewCue: '壳杏白、雾桃粉与灰莓紫的成熟提气关系',
      secondaryColorSummary: '雾桃粉',
    },
    {
      accentColorSummary: '浅玫棕',
      colorSummary: ['奶壳白', '雾藕粉', '浅玫棕'],
      marketSignal:
        '女装通勤提气色越来越多地把粉感压到藕粉和浅玫棕的成熟区间。',
      primaryColorSummary: '奶壳白',
      reviewCue: '奶壳白、雾藕粉与浅玫棕能否兼顾温柔和专业',
      secondaryColorSummary: '雾藕粉',
    },
    {
      accentColorSummary: '烟紫灰',
      colorSummary: ['柔米白', '淡杏灰', '烟紫灰'],
      marketSignal:
        '柔和提气路线会把粉紫控制在烟感范围内，避免形成少女感断层。',
      primaryColorSummary: '柔米白',
      reviewCue: '柔米白、淡杏灰与烟紫灰是否保留通勤温度',
      secondaryColorSummary: '淡杏灰',
    },
    {
      accentColorSummary: '灰豆粉',
      colorSummary: ['云奶白', '浅藕粉', '灰豆粉'],
      marketSignal:
        '成熟通勤提气会把豆粉压到灰感区间，再配云奶白和浅藕粉去保持轻盈。',
      primaryColorSummary: '云奶白',
      reviewCue: '云奶白、浅藕粉与灰豆粉是否柔和提气但不甜腻',
      secondaryColorSummary: '浅藕粉',
    },
    {
      accentColorSummary: '烟杏棕',
      colorSummary: ['暖米白', '柔桃杏', '烟杏棕'],
      marketSignal:
        '柔和提气路线也会把杏色往成熟棕感推进，适合针织和衬衫的通勤表达。',
      primaryColorSummary: '暖米白',
      reviewCue: '暖米白、柔桃杏与烟杏棕的成熟温柔关系',
      secondaryColorSummary: '柔桃杏',
    },
    {
      accentColorSummary: '雾玫灰',
      colorSummary: ['奶雾白', '淡莓粉', '雾玫灰'],
      marketSignal: '更克制的通勤提气路线会把玫调压进灰感，避免出现甜美断层。',
      primaryColorSummary: '奶雾白',
      reviewCue: '奶雾白、淡莓粉与雾玫灰是否形成低饱和提气',
      secondaryColorSummary: '淡莓粉',
    },
  ],
  'mist-cool-commute': [
    themeCandidateProfiles['mist-cool-commute']!,
    {
      accentColorSummary: '深岩灰',
      colorSummary: ['雾灰白', '浅钢蓝', '深岩灰'],
      marketSignal:
        '冷静通勤的安全做法是灰白搭浅钢蓝，再用深岩灰稳定全身重心。',
      primaryColorSummary: '雾灰白',
      reviewCue: '雾灰白、浅钢蓝与深岩灰的克制冷调',
      secondaryColorSummary: '浅钢蓝',
    },
    {
      accentColorSummary: '铅墨灰',
      colorSummary: ['冷米白', '薄雾蓝', '铅墨灰'],
      marketSignal:
        '冷米白与薄雾蓝是更容易落到衬衫与外套上的冷静组合，铅墨灰负责收尾。',
      primaryColorSummary: '冷米白',
      reviewCue: '冷米白、薄雾蓝与铅墨灰是否保持冷静但不寡淡',
      secondaryColorSummary: '薄雾蓝',
    },
    {
      accentColorSummary: '烟绿灰',
      colorSummary: ['霜灰白', '青灰蓝', '烟绿灰'],
      marketSignal: '冷调通勤也会吸收一点青灰和绿灰，让女装路线看起来更现代。',
      primaryColorSummary: '霜灰白',
      reviewCue: '霜灰白、青灰蓝与烟绿灰的现代冷静关系',
      secondaryColorSummary: '青灰蓝',
    },
    {
      accentColorSummary: '冷石墨',
      colorSummary: ['浅雾灰', '海雾蓝', '冷石墨'],
      marketSignal:
        '海雾蓝和浅雾灰适合更柔和的冷调女装，冷石墨帮助保持专业边界。',
      primaryColorSummary: '浅雾灰',
      reviewCue: '浅雾灰、海雾蓝与冷石墨的通勤清醒感',
      secondaryColorSummary: '海雾蓝',
    },
    {
      accentColorSummary: '墨蓝灰',
      colorSummary: ['冷雾白', '银雾蓝', '墨蓝灰'],
      marketSignal:
        '冷静通勤常用更轻的白灰与银雾蓝做前景，再用墨蓝灰拉回专业重心。',
      primaryColorSummary: '冷雾白',
      reviewCue: '冷雾白、银雾蓝与墨蓝灰是否形成明确但不压迫的冷调层次',
      secondaryColorSummary: '银雾蓝',
    },
    {
      accentColorSummary: '冷杉灰',
      colorSummary: ['浅米灰', '雾青蓝', '冷杉灰'],
      marketSignal:
        '雾青蓝与冷杉灰能让冷静路线更现代，尤其适合外套和衬衫的都市通勤。',
      primaryColorSummary: '浅米灰',
      reviewCue: '浅米灰、雾青蓝与冷杉灰的现代冷静度',
      secondaryColorSummary: '雾青蓝',
    },
    {
      accentColorSummary: '板岩灰',
      colorSummary: ['冰米白', '薄烟蓝', '板岩灰'],
      marketSignal:
        '更轻的冰米白和薄烟蓝适合春夏冷静通勤，再以板岩灰收住边界。',
      primaryColorSummary: '冰米白',
      reviewCue: '冰米白、薄烟蓝与板岩灰是否足够清醒且实穿',
      secondaryColorSummary: '薄烟蓝',
    },
  ],
  'warm-grounded-commute': [
    themeCandidateProfiles['warm-grounded-commute']!,
    {
      accentColorSummary: '焦糖棕',
      colorSummary: ['燕麦米', '灰咖棕', '焦糖棕'],
      marketSignal: '暖稳通勤不一定要酒红，焦糖棕更适合成熟外套和针织路线。',
      primaryColorSummary: '燕麦米',
      reviewCue: '燕麦米、灰咖棕与焦糖棕的暖稳成熟度',
      secondaryColorSummary: '灰咖棕',
    },
    {
      accentColorSummary: '橡木棕',
      colorSummary: ['奶驼', '炭褐灰', '橡木棕'],
      marketSignal:
        '秋冬暖稳路线会把深色压在炭褐灰和橡木棕之间，减少纯黑带来的硬感。',
      primaryColorSummary: '奶驼',
      reviewCue: '奶驼、炭褐灰和橡木棕是否足够稳重但不沉闷',
      secondaryColorSummary: '炭褐灰',
    },
    {
      accentColorSummary: '砖茶红',
      colorSummary: ['亚麻驼', '深灰棕', '砖茶红'],
      marketSignal: '成熟暖色路线更适合砖茶红这种偏棕提气，而不是亮红。',
      primaryColorSummary: '亚麻驼',
      reviewCue: '亚麻驼、深灰棕与砖茶红的秋冬提气比例',
      secondaryColorSummary: '深灰棕',
    },
    {
      accentColorSummary: '可可棕',
      colorSummary: ['浅燕麦', '烟褐灰', '可可棕'],
      marketSignal:
        '浅燕麦配烟褐灰是更实穿的通勤暖基底，可可棕适合点到为止地补层次。',
      primaryColorSummary: '浅燕麦',
      reviewCue: '浅燕麦、烟褐灰与可可棕的实穿暖稳关系',
      secondaryColorSummary: '烟褐灰',
    },
    {
      accentColorSummary: '栗棕',
      colorSummary: ['暖燕麦', '烟咖灰', '栗棕'],
      marketSignal:
        '暖稳通勤会用暖燕麦和烟咖灰做实穿底，再用栗棕建立秋冬层次。',
      primaryColorSummary: '暖燕麦',
      reviewCue: '暖燕麦、烟咖灰与栗棕的成熟暖感是否协调',
      secondaryColorSummary: '烟咖灰',
    },
    {
      accentColorSummary: '暖枣红',
      colorSummary: ['驼米白', '炭咖棕', '暖枣红'],
      marketSignal: '成熟暖色通勤会用更克制的枣红做点缀，而不是高亮酒红。',
      primaryColorSummary: '驼米白',
      reviewCue: '驼米白、炭咖棕与暖枣红的提气比例是否克制',
      secondaryColorSummary: '炭咖棕',
    },
    {
      accentColorSummary: '深焦糖棕',
      colorSummary: ['奶茶米', '褐灰', '深焦糖棕'],
      marketSignal:
        '暖稳秋冬路线也会用奶茶米和褐灰打底，再以深焦糖棕提升质感和分量。',
      primaryColorSummary: '奶茶米',
      reviewCue: '奶茶米、褐灰与深焦糖棕是否既温和又有秋冬分量',
      secondaryColorSummary: '褐灰',
    },
  ],
};

const womenswearBrandProfiles: BrandCandidateProfile[] = [
  {
    brandName: 'COS',
    categoryFocus: ['blazer', 'shirt', 'coat', 'trousers', 'dress'],
    marketSignal: 'COS 更适合承担极简通勤与轻正式路线的基准样本。',
    siteUrl: 'https://www.cos.com/',
    styleSignals: ['minimal', 'commute', 'womenswear'],
    themeKeys: [
      'polished-light-commute',
      'urban-minimal-foundation',
      'mist-cool-commute',
      'city-gallery-weekend',
      'urban-casual-denim',
      'holiday-sunlit-escape',
      'holiday-postcard-evening',
    ],
  },
  {
    brandName: 'Massimo Dutti',
    categoryFocus: ['blazer', 'shirt', 'trench', 'coat', 'skirt'],
    marketSignal: 'Massimo Dutti 更适合暖中性色、轻商务和成熟通勤路线。',
    siteUrl: 'https://www.massimodutti.com/',
    styleSignals: ['polished', 'refined', 'womenswear'],
    themeKeys: [
      'polished-light-commute',
      'warm-grounded-commute',
      'soft-tone-lift',
      'warm-market-weekend',
      'light-social-polished-dinner',
      'holiday-market-stroll',
      'holiday-postcard-evening',
    ],
  },
  {
    brandName: 'Theory',
    categoryFocus: ['blazer', 'trousers', 'shirt', 'dress'],
    marketSignal: 'Theory 更适合剪裁明确、冷静专业的女装通勤样本。',
    siteUrl: 'https://www.theory.com/',
    styleSignals: ['tailored', 'sharp', 'womenswear'],
    themeKeys: [
      'polished-light-commute',
      'urban-minimal-foundation',
      'mist-cool-commute',
      'city-gallery-weekend',
      'light-social-polished-dinner',
      'light-social-night-navy',
    ],
  },
  {
    brandName: 'ARKET',
    categoryFocus: ['coat', 'knitwear', 'shirt', 'trousers'],
    marketSignal: 'ARKET 适合北欧极简与低彩度通勤样本。',
    siteUrl: 'https://www.arket.com/',
    styleSignals: ['nordic', 'minimal', 'womenswear'],
    themeKeys: [
      'urban-minimal-foundation',
      'mist-cool-commute',
      'warm-grounded-commute',
      'artful-brunch-weekend',
      'holiday-trail-soft-outing',
      'urban-casual-denim',
      'holiday-sunlit-escape',
    ],
  },
  {
    brandName: 'SEZANE',
    categoryFocus: ['blouse', 'cardigan', 'dress', 'skirt'],
    marketSignal: 'SEZANE 更适合柔和提气与女性化但不甜腻的通勤路线。',
    siteUrl: 'https://www.sezane.com/',
    styleSignals: ['soft', 'feminine-leaning', 'womenswear'],
    themeKeys: [
      'soft-tone-lift',
      'polished-light-commute',
      'soft-date-weekend',
      'artful-brunch-weekend',
      'light-social-glow',
      'light-social-modern-romance',
      'light-social-sage-polish',
      'holiday-sunlit-escape',
    ],
  },
  {
    brandName: 'TOTEME',
    categoryFocus: ['coat', 'knitwear', 'shirt', 'trench'],
    marketSignal: 'TOTEME 更适合冷静、低对比、材质感强的女装通勤样本。',
    siteUrl: 'https://toteme.com/',
    styleSignals: ['quiet', 'refined', 'womenswear'],
    themeKeys: [
      'mist-cool-commute',
      'urban-minimal-foundation',
      'city-gallery-weekend',
      'sunset-cafe-weekend',
      'holiday-sunlit-escape',
      'light-social-night-navy',
    ],
  },
  {
    brandName: 'UNIQLO',
    categoryFocus: ['shirt', 'cardigan', 'knitwear', 'trousers'],
    marketSignal: 'UNIQLO 可以补大众通勤基础款的颜色分布与保守安全样本。',
    siteUrl: 'https://www.uniqlo.com/',
    styleSignals: ['daily', 'commute', 'womenswear'],
    themeKeys: [
      'polished-light-commute',
      'soft-tone-lift',
      'warm-grounded-commute',
      'urban-casual-denim',
      'warm-market-weekend',
      'holiday-market-stroll',
      'holiday-trail-soft-outing',
      'light-social-sage-polish',
    ],
  },
  {
    brandName: 'Vince',
    categoryFocus: ['coat', 'knitwear', 'blazer', 'dress'],
    marketSignal: 'Vince 更适合柔和中性色和都市暖稳路线。',
    siteUrl: 'https://www.vince.com/',
    styleSignals: ['soft', 'grounded', 'womenswear'],
    themeKeys: [
      'warm-grounded-commute',
      'soft-tone-lift',
      'sunset-cafe-weekend',
      'soft-date-weekend',
      'light-social-modern-romance',
      'holiday-market-stroll',
      'light-social-glow',
    ],
  },
];

const fallbackThemeCandidateProfile: ThemeCandidateProfile =
  themeCandidateProfiles['polished-light-commute']!;
const fallbackBrandCandidateProfile: BrandCandidateProfile =
  womenswearBrandProfiles[0]!;
const expandedThemeProfilePoolCache = new Map<
  string,
  ThemeCandidateProfile[]
>();

function buildCurrentDateLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildPublicSearchUrl(keyword: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
}

function buildMultiBrandSearchUrl(keyword: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:net-a-porter.com ${keyword}`)}`;
}

function buildSearchSourceUrl(
  record: SamplingRecord,
  brandName: string,
): string {
  const categoryTerms = categorySearchTerms[record.itemCategory] ?? {
    en: record.itemCategory || 'women clothing',
    zh: `女装 ${record.itemCategory || '通勤'}`,
  };

  if (record.channelType === 'brand-flagship-store') {
    return buildPublicSearchUrl(
      `${brandName} ${categoryTerms.en} women official brand search`,
    );
  }

  if (record.channelType === 'marketplace-brand-store') {
    return buildPublicSearchUrl(
      `${brandName} ${categoryTerms.en} women outfit search`,
    );
  }

  if (record.channelType === 'multi-brand-platform') {
    return buildMultiBrandSearchUrl(`${brandName} ${categoryTerms.en}`);
  }

  const matchedBrand = womenswearBrandProfiles.find(
    (profile) => profile.brandName === brandName,
  );

  return matchedBrand?.siteUrl ?? 'https://www.google.com/';
}

function buildPlatformLabel(record: SamplingRecord, brandName: string): string {
  if (record.channelType === 'brand-flagship-store') {
    return `${brandName} 公开品牌检索`;
  }

  if (record.channelType === 'marketplace-brand-store') {
    return `${brandName} 公开店铺检索`;
  }

  if (record.channelType === 'multi-brand-platform') {
    return 'Net-a-Porter 公开检索';
  }

  return `${brandName} 官网`;
}

function buildSourceId(record: SamplingRecord, brandName: string): string {
  const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const itemSlug = (record.itemCategory || 'candidate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  return `candidate-${brandSlug}-${itemSlug}-${record.samplingId.toLowerCase()}`;
}

function stripGeneratedSegments(existingNotes: string): string {
  return (
    existingNotes
      .split(/；自动候选：|;\s*自动候选：/)[0]
      ?.split(/；AI 分析：|;\s*AI 分析：/)[0]
      ?.trim() ?? ''
  );
}

function buildReviewNote(
  existingNotes: string,
  generatedNote: string,
  shouldRefreshGenerated: boolean,
): string {
  const baseNotes = shouldRefreshGenerated
    ? stripGeneratedSegments(existingNotes)
    : existingNotes.trim();

  if (!baseNotes) {
    return generatedNote;
  }

  if (baseNotes.includes(generatedNote)) {
    return baseNotes;
  }

  return `${baseNotes}；${generatedNote}`;
}

function mergeUniqueStrings(values: string[], additions: string[]): string[] {
  return Array.from(
    new Set(
      [...values, ...additions].map((item) => item.trim()).filter(Boolean),
    ),
  );
}

function normalizeMode(mode: string | undefined): CandidateGenerationMode {
  if (mode === 'model-only' || mode === 'rules-only') {
    return mode;
  }

  return 'hybrid';
}

function parseModelEnhancements(
  content: string,
): Map<string, ModelCandidateEnhancement> {
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)```/i);
  const jsonPayload = jsonBlockMatch?.[1] ?? content;
  const parsed = JSON.parse(jsonPayload) as {
    records?: ModelCandidateEnhancement[];
  };

  return new Map((parsed.records ?? []).map((item) => [item.samplingId, item]));
}

function pickBrandProfile(
  record: SamplingRecord,
  index: number,
  generationSeed: string,
): BrandCandidateProfile {
  const themePool = womenswearBrandProfiles.filter((profile) =>
    profile.themeKeys.includes(record.themeKey),
  );
  const categoryPool = themePool.filter((profile) =>
    profile.categoryFocus.includes(record.itemCategory),
  );
  const candidatePool =
    categoryPool.length > 0
      ? categoryPool
      : themePool.length > 0
        ? themePool
        : womenswearBrandProfiles;
  const normalizedIndex = buildStableVariantIndex(
    `${generationSeed}:${record.samplingId}:${record.itemCategory}:${record.themeKey}:${index}`,
    candidatePool.length,
  );

  return candidatePool[normalizedIndex] ?? fallbackBrandCandidateProfile;
}

function buildStableVariantIndex(seed: string, poolLength: number): number {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 33 + character.charCodeAt(0)) % 2147483647;
  }

  return Math.abs(hash) % Math.max(poolLength, 1);
}

function normalizePaletteSignatureToken(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function buildThemeProfileSignature(
  profile: ThemeCandidateProfile,
): string | null {
  const tokens = [
    normalizePaletteSignatureToken(profile.primaryColorSummary),
    normalizePaletteSignatureToken(profile.secondaryColorSummary),
    normalizePaletteSignatureToken(profile.accentColorSummary),
    ...profile.colorSummary.map((item) => normalizePaletteSignatureToken(item)),
  ].filter(Boolean);

  return tokens.length > 0 ? tokens.slice(0, 6).join('|') : null;
}

function buildSamplingRecordPaletteSignature(
  record: SamplingRecord,
): string | null {
  const tokens = [
    normalizePaletteSignatureToken(record.primaryColorSummary),
    normalizePaletteSignatureToken(record.secondaryColorSummary),
    normalizePaletteSignatureToken(record.accentColorSummary),
    ...record.colorSummary.map((item) => normalizePaletteSignatureToken(item)),
  ].filter(Boolean);

  return tokens.length > 0 ? tokens.slice(0, 6).join('|') : null;
}

function resolveSemanticColorBucket(
  value: string | undefined,
  fallbackIndex: number,
): string {
  const normalized = normalizePaletteSignatureToken(value);

  if (!normalized) {
    return `fallback-${fallbackIndex}`;
  }

  const matchedPreset = semanticColorBucketPresets.find((preset) =>
    preset.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return matchedPreset?.bucket ?? `fallback-${fallbackIndex}`;
}

function buildSemanticPaletteSignatureFromValues(
  values: Array<string | undefined>,
): string | null {
  const seen = new Set<string>();
  const buckets: string[] = [];

  for (const value of values) {
    const normalized = normalizePaletteSignatureToken(value);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    buckets.push(resolveSemanticColorBucket(value, buckets.length));

    if (buckets.length === 3) {
      break;
    }
  }

  return buckets.length > 0 ? buckets.join('|') : null;
}

function buildThemeProfileSemanticPaletteSignature(
  profile: ThemeCandidateProfile,
): string | null {
  return buildSemanticPaletteSignatureFromValues([
    profile.primaryColorSummary,
    profile.secondaryColorSummary,
    profile.accentColorSummary,
    ...profile.colorSummary,
  ]);
}

function buildSamplingRecordSemanticPaletteSignature(
  record: SamplingRecord,
): string | null {
  return buildSemanticPaletteSignatureFromValues([
    record.primaryColorSummary,
    record.secondaryColorSummary,
    record.accentColorSummary,
    ...record.colorSummary,
  ]);
}

function isSemanticColorBucket(
  value: string | undefined,
): value is SemanticColorBucket {
  return semanticColorBucketPresets.some((preset) => preset.bucket === value);
}

function mergeSemanticBucketPreferences(
  ...groups: SemanticColorBucket[][]
): SemanticColorBucket[] {
  return Array.from(new Set(groups.flat(2)));
}

function buildFallbackThemeSyntheticPaletteBlueprint(
  themeKey: string,
): ThemeSyntheticPaletteBlueprint {
  const baseProfile =
    themeCandidateProfiles[themeKey] ?? fallbackThemeCandidateProfile;
  const [basePrimaryBucket, baseSecondaryBucket, baseAccentBucket] = (
    buildThemeProfileSemanticPaletteSignature(baseProfile)?.split('|') ?? []
  ).filter(isSemanticColorBucket);
  const primarySeed = [basePrimaryBucket].filter(isSemanticColorBucket);
  const secondarySeed = [baseSecondaryBucket].filter(isSemanticColorBucket);
  const accentSeed = [baseAccentBucket].filter(isSemanticColorBucket);
  const normalizedThemeKey = themeKey.trim().toLowerCase();
  const isWarmFamily = /warm|autumn|grounded|earth|camel|beige/.test(
    normalizedThemeKey,
  );
  const isCoolFamily = /cool|mist|urban|minimal|slate|marine|navy/.test(
    normalizedThemeKey,
  );
  const isSoftFamily = /soft|romantic|lift|rose|powder|gentle/.test(
    normalizedThemeKey,
  );
  const isHolidayFamily = /holiday|festive|party|celebration/.test(
    normalizedThemeKey,
  );
  const isWeekendFamily = /weekend|casual|relaxed|day-off/.test(
    normalizedThemeKey,
  );

  const primaryBuckets = isWarmFamily
    ? mergeSemanticBucketPreferences(primarySeed, [
        'beige',
        'light-neutral',
        'brown',
        'mist-blue',
      ])
    : isCoolFamily
      ? mergeSemanticBucketPreferences(primarySeed, [
          'mist-blue',
          'light-neutral',
          'gray',
          'beige',
        ])
      : mergeSemanticBucketPreferences(primarySeed, [
          'light-neutral',
          'beige',
          'mist-blue',
          'gray',
        ]);

  const secondaryBuckets = isWarmFamily
    ? mergeSemanticBucketPreferences(secondarySeed, [
        'brown',
        'gray',
        'olive',
        'rust',
        'beige',
      ])
    : isSoftFamily
      ? mergeSemanticBucketPreferences(secondarySeed, [
          'beige',
          'mist-blue',
          'brown',
          'gray',
          'rust',
        ])
      : isHolidayFamily
        ? mergeSemanticBucketPreferences(secondarySeed, [
            'navy',
            'brown',
            'beige',
            'olive',
            'gray',
          ])
        : isWeekendFamily
          ? mergeSemanticBucketPreferences(secondarySeed, [
              'olive',
              'beige',
              'mist-blue',
              'gray',
              'brown',
            ])
          : isCoolFamily
            ? mergeSemanticBucketPreferences(secondarySeed, [
                'gray',
                'navy',
                'light-neutral',
                'olive',
                'beige',
              ])
            : mergeSemanticBucketPreferences(secondarySeed, [
                'mist-blue',
                'beige',
                'gray',
                'olive',
                'brown',
              ]);

  const accentBuckets = isWarmFamily
    ? mergeSemanticBucketPreferences(accentSeed, [
        'rust',
        'brown',
        'olive',
        'gray',
        'navy',
      ])
    : isSoftFamily
      ? mergeSemanticBucketPreferences(accentSeed, [
          'brown',
          'rust',
          'gray',
          'olive',
          'navy',
        ])
      : isHolidayFamily
        ? mergeSemanticBucketPreferences(accentSeed, [
            'rust',
            'navy',
            'brown',
            'olive',
            'gray',
          ])
        : isWeekendFamily
          ? mergeSemanticBucketPreferences(accentSeed, [
              'olive',
              'brown',
              'navy',
              'rust',
              'gray',
            ])
          : isCoolFamily
            ? mergeSemanticBucketPreferences(accentSeed, [
                'gray',
                'navy',
                'olive',
                'brown',
                'rust',
              ])
            : mergeSemanticBucketPreferences(accentSeed, [
                'gray',
                'brown',
                'navy',
                'olive',
                'rust',
              ]);

  return {
    accentBuckets,
    primaryBuckets,
    reviewFocus: isHolidayFamily
      ? '假日场景层次'
      : isWeekendFamily
        ? '周末场景松弛层次'
        : '场景色盘层次',
    secondaryBuckets,
  };
}

function resolveThemeSyntheticPaletteBlueprint(
  themeKey: string,
): ThemeSyntheticPaletteBlueprint {
  return (
    themeSyntheticPaletteBlueprints[themeKey] ??
    buildFallbackThemeSyntheticPaletteBlueprint(themeKey)
  );
}

function buildSyntheticThemeProfile(
  themeKey: string,
  buckets: [SemanticColorBucket, SemanticColorBucket, SemanticColorBucket],
  variantIndex: number,
): ThemeCandidateProfile {
  const [primaryBucket, secondaryBucket, accentBucket] = buckets;
  const blueprint = resolveThemeSyntheticPaletteBlueprint(themeKey);
  const baseProfile =
    themeCandidateProfiles[themeKey] ?? fallbackThemeCandidateProfile;
  const primaryColorSummary = pickSemanticBucketLabel(
    primaryBucket,
    variantIndex,
    0,
  );
  const secondaryColorSummary = pickSemanticBucketLabel(
    secondaryBucket,
    variantIndex,
    1,
  );
  const accentColorSummary = pickSemanticBucketLabel(
    accentBucket,
    variantIndex,
    2,
  );

  return {
    accentColorSummary,
    colorSummary: [
      primaryColorSummary,
      secondaryColorSummary,
      accentColorSummary,
    ],
    marketSignal: baseProfile.marketSignal,
    primaryColorSummary,
    reviewCue: `${primaryColorSummary}、${secondaryColorSummary}与${accentColorSummary}的${blueprint?.reviewFocus ?? '通勤层次关系'}`,
    secondaryColorSummary,
  };
}

function buildThemeProfilePool(themeKey: string): ThemeCandidateProfile[] {
  const cached = expandedThemeProfilePoolCache.get(themeKey);

  if (cached) {
    return cached;
  }

  const basePool = themeCandidateProfileVariants[themeKey] ?? [
    themeCandidateProfiles[themeKey] ?? fallbackThemeCandidateProfile,
  ];
  const blueprint = resolveThemeSyntheticPaletteBlueprint(themeKey);
  const nextPool: ThemeCandidateProfile[] = [];
  const seenSemanticSignatures = new Set<string>();

  const pushIfUnique = (profile: ThemeCandidateProfile): void => {
    const semanticSignature =
      buildThemeProfileSemanticPaletteSignature(profile) ??
      buildThemeProfileSignature(profile);

    if (semanticSignature && seenSemanticSignatures.has(semanticSignature)) {
      return;
    }

    if (semanticSignature) {
      seenSemanticSignatures.add(semanticSignature);
    }

    nextPool.push(profile);
  };

  for (const profile of basePool) {
    pushIfUnique(profile);
  }

  if (blueprint) {
    let variantIndex = 0;

    for (const primaryBucket of blueprint.primaryBuckets) {
      for (const secondaryBucket of blueprint.secondaryBuckets) {
        for (const accentBucket of blueprint.accentBuckets) {
          const distinctBucketCount = new Set([
            primaryBucket,
            secondaryBucket,
            accentBucket,
          ]).size;

          if (distinctBucketCount < 3) {
            continue;
          }

          pushIfUnique(
            buildSyntheticThemeProfile(
              themeKey,
              [primaryBucket, secondaryBucket, accentBucket],
              variantIndex,
            ),
          );
          variantIndex += 1;
        }
      }
    }
  }

  const result = nextPool.length > 0 ? nextPool : basePool;

  expandedThemeProfilePoolCache.set(themeKey, result);

  return result;
}

function pickSemanticBucketLabel(
  bucket: SemanticColorBucket,
  variantIndex: number,
  slotOffset: number,
): string {
  const labelPool = semanticBucketLabelOptions[bucket];

  if (!labelPool || labelPool.length === 0) {
    return bucket;
  }

  return labelPool[(variantIndex + slotOffset) % labelPool.length] ?? bucket;
}

function buildRecordSemanticPaletteSignatureSet(
  records: SamplingRecord[],
): Set<string> {
  const signatures = new Set<string>();

  for (const record of records) {
    const signature = buildSamplingRecordSemanticPaletteSignature(record);

    if (signature) {
      signatures.add(signature);
    }
  }

  return signatures;
}

function buildThemeCapacitySemanticPaletteSignatureSet(
  themeKeys: string[],
): Set<string> {
  const signatures = new Set<string>();

  for (const themeKey of Array.from(
    new Set(themeKeys.map((item) => item.trim()).filter(Boolean)),
  )) {
    for (const profile of buildThemeProfilePool(themeKey)) {
      const signature = buildThemeProfileSemanticPaletteSignature(profile);

      if (signature) {
        signatures.add(signature);
      }
    }
  }

  return signatures;
}

function buildSamplingIdPrefix(batchId: string, occasionId: string): string {
  const batchNumber = batchId.match(/batch(\d+)$/)?.[1];

  return `sam_${occasionId}_${batchNumber ? `b${batchNumber}` : batchId.replace(/-/g, '_')}_`;
}

function buildThemeLabelMap(
  document: SamplingBatchDocument,
): Map<string, string> {
  const labelMap = new Map<string, string>();

  for (const item of document.items) {
    if (
      item.themeKey.trim() &&
      item.themeLabelZh.trim() &&
      !labelMap.has(item.themeKey)
    ) {
      labelMap.set(item.themeKey, item.themeLabelZh);
    }
  }

  for (const themeKey of document.batch.themeKeys) {
    if (!labelMap.has(themeKey)) {
      labelMap.set(themeKey, defaultThemeLabelMap[themeKey] ?? themeKey);
    }
  }

  return labelMap;
}

function buildPreparedGenerationRecord({
  index,
  itemCategory,
  occasionId,
  productionBatchId,
  samplingId,
  sourceWhitelistIds,
  themeKey,
  themeLabelZh,
}: PreparedGenerationRecordOptions): SamplingRecord {
  return {
    accentColorSummary: '',
    brandName: '',
    candidatePaletteIds: [],
    channelType:
      sourceWhitelistIds[index % Math.max(sourceWhitelistIds.length, 1)] ?? '',
    colorSummary: [],
    digestionStatus: 'sampled',
    finalPaletteIds: [],
    itemCategory,
    marketSignals: '',
    notes: '',
    observedAt: '',
    occasionId,
    platform: '',
    primaryColorSummary: '',
    productionBatchId,
    samplingId,
    seasonHint: seasonalHintByCategory[itemCategory] ?? 'all',
    secondaryColorSummary: '',
    sourceId: '',
    sourceUrl: '',
    styleSignals: [],
    themeKey,
    themeLabelZh,
  };
}

function prepareBatchRecordsForGeneration(
  document: SamplingBatchDocument,
  payload: GenerateSamplingCandidatesDto,
): SamplingRecord[] {
  const targetCount = payload.targetCount;

  if (
    targetCount !== undefined &&
    (!Number.isInteger(targetCount) || targetCount <= 0)
  ) {
    throw new BadRequestException(
      'targetCount must be a positive integer when provided.',
    );
  }

  const shouldResetExisting = payload.resetExisting ?? false;
  const baseItems = shouldResetExisting ? [] : document.items;
  const desiredCount = Math.max(
    targetCount ?? baseItems.length,
    baseItems.length,
  );

  if (desiredCount <= baseItems.length) {
    return baseItems;
  }

  const themeKeys = document.batch.themeKeys;

  if (themeKeys.length === 0) {
    throw new BadRequestException(
      'batch.themeKeys must contain at least one theme key.',
    );
  }

  const categoryKeys =
    occasionCategoryMatrix[document.batch.occasionId] ??
    Object.keys(categorySearchTerms);
  const themeLabelMap = buildThemeLabelMap(document);
  const idPrefix = buildSamplingIdPrefix(
    document.batch.id,
    document.batch.occasionId,
  );
  const nextItems = [...baseItems];

  for (let index = baseItems.length; index < desiredCount; index += 1) {
    const themeKey = themeKeys[index % themeKeys.length] ?? themeKeys[0]!;
    const categoryIndex =
      Math.floor(index / themeKeys.length) % Math.max(categoryKeys.length, 1);
    const itemCategory = categoryKeys[categoryIndex] ?? categoryKeys[0]!;

    nextItems.push(
      buildPreparedGenerationRecord({
        index,
        itemCategory,
        occasionId: document.batch.occasionId,
        productionBatchId: document.batch.id,
        samplingId: `${idPrefix}${String(index + 1).padStart(3, '0')}`,
        sourceWhitelistIds: document.batch.sourceWhitelistIds,
        themeKey,
        themeLabelZh: themeLabelMap.get(themeKey) ?? themeKey,
      }),
    );
  }

  return nextItems;
}

function pickThemeProfile(
  record: SamplingRecord,
  index: number,
  brandProfile: BrandCandidateProfile,
  usedPaletteSignatures?: Set<string>,
  usedSemanticPaletteSignatures?: Set<string>,
  generationSeed = 'stable',
  requireUniqueSemanticSignature = false,
): ThemeCandidateProfile | null {
  const profilePool = buildThemeProfilePool(record.themeKey);
  const variantIndex = buildStableVariantIndex(
    `${generationSeed}:${record.samplingId}:${record.itemCategory}:${brandProfile.brandName}:${index}`,
    profilePool.length,
  );

  if (
    (usedPaletteSignatures || usedSemanticPaletteSignatures) &&
    profilePool.length > 1
  ) {
    for (let offset = 0; offset < profilePool.length; offset += 1) {
      const candidateProfile =
        profilePool[(variantIndex + offset) % profilePool.length];

      if (!candidateProfile) {
        continue;
      }

      const candidateSignature = buildThemeProfileSignature(candidateProfile);
      const candidateSemanticSignature =
        buildThemeProfileSemanticPaletteSignature(candidateProfile);

      const isExactAvailable =
        !candidateSignature || !usedPaletteSignatures?.has(candidateSignature);
      const isSemanticAvailable =
        !candidateSemanticSignature ||
        !usedSemanticPaletteSignatures?.has(candidateSemanticSignature);

      if (isExactAvailable && isSemanticAvailable) {
        return candidateProfile;
      }
    }

    if (!requireUniqueSemanticSignature) {
      for (let offset = 0; offset < profilePool.length; offset += 1) {
        const candidateProfile =
          profilePool[(variantIndex + offset) % profilePool.length];

        if (!candidateProfile) {
          continue;
        }

        const candidateSignature = buildThemeProfileSignature(candidateProfile);

        if (
          !candidateSignature ||
          !usedPaletteSignatures?.has(candidateSignature)
        ) {
          return candidateProfile;
        }
      }

      return (
        profilePool[variantIndex] ??
        themeCandidateProfiles[record.themeKey] ??
        fallbackThemeCandidateProfile
      );
    }

    return null;
  }

  const fallbackProfile =
    profilePool[variantIndex] ??
    themeCandidateProfiles[record.themeKey] ??
    fallbackThemeCandidateProfile;

  if (!requireUniqueSemanticSignature) {
    return fallbackProfile;
  }

  const fallbackSemanticSignature =
    buildThemeProfileSemanticPaletteSignature(fallbackProfile);

  if (
    fallbackSemanticSignature &&
    usedSemanticPaletteSignatures?.has(fallbackSemanticSignature)
  ) {
    return null;
  }

  return fallbackProfile;
}

function shouldRefreshGeneratedCandidate(
  record: SamplingRecord,
  overwriteExisting: boolean,
): boolean {
  return (
    overwriteExisting ||
    (record.digestionStatus === 'sampled' &&
      record.sourceId.startsWith('candidate-'))
  );
}

function shouldReplaceScalar(
  value: string | undefined,
  overwriteExisting: boolean,
): boolean {
  return overwriteExisting || !value?.trim();
}

function shouldReplaceArray(
  values: string[],
  overwriteExisting: boolean,
): boolean {
  return overwriteExisting || values.length === 0;
}

@Injectable()
export class SamplingCandidateGenerationService {
  private readonly logger = new Logger(SamplingCandidateGenerationService.name);

  getCapabilities(): SamplingCandidateGenerationCapabilities {
    const modelEnabled = Boolean(
      process.env.DAYPALETTE_LLM_API_KEY?.trim() &&
      process.env.DAYPALETTE_LLM_MODEL?.trim(),
    );

    return {
      defaultMode: modelEnabled ? 'hybrid' : 'rules-only',
      modelEnabled,
      rulesEnabled: true,
    };
  }

  buildBatchGenerationSummary(
    document: Pick<SamplingBatchDocument, 'batch' | 'items'>,
  ): SamplingBatchGenerationSummaryMetrics {
    const visibleUniqueCount = buildRecordSemanticPaletteSignatureSet(
      document.items,
    ).size;
    const visibleUniqueCapacity = buildThemeCapacitySemanticPaletteSignatureSet(
      document.batch.themeKeys,
    ).size;

    return {
      remainingVisibleUniqueCapacity: Math.max(
        visibleUniqueCapacity - visibleUniqueCount,
        0,
      ),
      visibleUniqueCapacity,
      visibleUniqueCount,
    };
  }

  async generateBatchCandidates(
    document: SamplingBatchDocument,
    payload: GenerateSamplingCandidatesDto = {},
  ): Promise<SamplingRecord[]> {
    const mode = normalizeMode(payload.mode);
    const sourceItems = prepareBatchRecordsForGeneration(document, payload);
    const overwriteExisting = payload.resetExisting
      ? true
      : (payload.overwriteExisting ?? false);
    const generationSeed = payload.resetExisting
      ? `reset:${document.version + 1}`
      : 'stable';

    if (overwriteExisting) {
      const generationSummary = this.buildBatchGenerationSummary({
        batch: document.batch,
        items: sourceItems,
      });

      if (sourceItems.length > generationSummary.visibleUniqueCapacity) {
        throw new BadRequestException(
          `Requested ${sourceItems.length} unique candidates, but batch ${document.batch.id} currently supports at most ${generationSummary.visibleUniqueCapacity} visible-unique palettes. Reduce targetCount or expand the scene palette pool first.`,
        );
      }
    }

    const usedPaletteSignatures = new Set<string>();
    const usedSemanticPaletteSignatures = new Set<string>();
    const nextItems = sourceItems.map((record, index) => {
      const nextRecord = this.applyRuleBasedCandidate(
        record,
        index,
        overwriteExisting,
        usedPaletteSignatures,
        usedSemanticPaletteSignatures,
        generationSeed,
      );
      const paletteSignature = buildSamplingRecordPaletteSignature(nextRecord);
      const semanticPaletteSignature =
        buildSamplingRecordSemanticPaletteSignature(nextRecord);

      if (paletteSignature) {
        usedPaletteSignatures.add(paletteSignature);
      }

      if (semanticPaletteSignature) {
        usedSemanticPaletteSignatures.add(semanticPaletteSignature);
      }

      return nextRecord;
    });

    if (mode === 'rules-only') {
      return nextItems;
    }

    return this.tryEnhanceWithModel(nextItems, document, mode);
  }

  private applyRuleBasedCandidate(
    record: SamplingRecord,
    index: number,
    overwriteExisting: boolean,
    usedPaletteSignatures: Set<string>,
    usedSemanticPaletteSignatures: Set<string>,
    generationSeed: string,
  ): SamplingRecord {
    const brandProfile = pickBrandProfile(record, index, generationSeed);
    const shouldRefreshGenerated = shouldRefreshGeneratedCandidate(
      record,
      overwriteExisting,
    );
    const themeProfile = pickThemeProfile(
      record,
      index,
      brandProfile,
      shouldRefreshGenerated ? usedPaletteSignatures : undefined,
      shouldRefreshGenerated ? usedSemanticPaletteSignatures : undefined,
      generationSeed,
      shouldRefreshGenerated,
    );

    if (!themeProfile) {
      throw new BadRequestException(
        `Unable to generate a visually unique candidate for ${record.samplingId}. Expand the theme palette pool or lower targetCount.`,
      );
    }

    const generatedNote = `自动候选：优先审阅 ${brandProfile.brandName} 的 ${buildPlatformLabel(record, brandProfile.brandName)} 入口，重点看 ${themeProfile.reviewCue}。`;

    return {
      ...record,
      brandName: shouldReplaceScalar(record.brandName, shouldRefreshGenerated)
        ? brandProfile.brandName
        : record.brandName,
      colorSummary: shouldReplaceArray(
        record.colorSummary,
        shouldRefreshGenerated,
      )
        ? themeProfile.colorSummary
        : record.colorSummary,
      marketSignals: shouldReplaceScalar(
        record.marketSignals,
        shouldRefreshGenerated,
      )
        ? `${themeProfile.marketSignal} ${brandProfile.marketSignal}`
        : record.marketSignals,
      notes: buildReviewNote(
        record.notes,
        generatedNote,
        shouldRefreshGenerated,
      ),
      observedAt: shouldReplaceScalar(record.observedAt, shouldRefreshGenerated)
        ? buildCurrentDateLabel()
        : record.observedAt,
      platform: shouldReplaceScalar(record.platform, shouldRefreshGenerated)
        ? buildPlatformLabel(record, brandProfile.brandName)
        : record.platform,
      primaryColorSummary: shouldReplaceScalar(
        record.primaryColorSummary,
        shouldRefreshGenerated,
      )
        ? themeProfile.primaryColorSummary
        : record.primaryColorSummary,
      secondaryColorSummary: shouldReplaceScalar(
        record.secondaryColorSummary,
        shouldRefreshGenerated,
      )
        ? themeProfile.secondaryColorSummary
        : record.secondaryColorSummary,
      accentColorSummary: shouldReplaceScalar(
        record.accentColorSummary,
        shouldRefreshGenerated,
      )
        ? themeProfile.accentColorSummary
        : record.accentColorSummary,
      sourceId: shouldReplaceScalar(record.sourceId, shouldRefreshGenerated)
        ? buildSourceId(record, brandProfile.brandName)
        : record.sourceId,
      sourceUrl: shouldReplaceScalar(record.sourceUrl, shouldRefreshGenerated)
        ? buildSearchSourceUrl(record, brandProfile.brandName)
        : record.sourceUrl,
      styleSignals: shouldRefreshGenerated
        ? [...brandProfile.styleSignals]
        : mergeUniqueStrings(record.styleSignals, brandProfile.styleSignals),
    };
  }

  private async tryEnhanceWithModel(
    records: SamplingRecord[],
    document: SamplingBatchDocument,
    mode: CandidateGenerationMode,
  ): Promise<SamplingRecord[]> {
    const apiKey = process.env.DAYPALETTE_LLM_API_KEY?.trim();
    const model = process.env.DAYPALETTE_LLM_MODEL?.trim();
    const baseUrl = (
      process.env.DAYPALETTE_LLM_BASE_URL?.trim() || 'https://api.openai.com/v1'
    ).replace(/\/$/, '');

    if (!apiKey || !model) {
      if (mode === 'model-only') {
        throw new BadRequestException(
          'DAYPALETTE_LLM_API_KEY and DAYPALETTE_LLM_MODEL are required when mode=model-only.',
        );
      }

      return records;
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a fashion color analyst for a local admin tool. Return strict JSON only. Improve color summaries and market signals for womenswear commute palette candidates. Do not add markdown fences unless required by provider.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                batch: {
                  id: document.batch.id,
                  occasionId: document.batch.occasionId,
                  themeKeys: document.batch.themeKeys,
                  titleZh: document.batch.titleZh,
                },
                instruction:
                  'For each record, refine primaryColorSummary, secondaryColorSummary, accentColorSummary, colorSummary (1-3 items), marketSignals, and notesSuffix. Keep the tone suitable for female workwear review. Return {"records": [...]}.',
                records: records.map((record) => ({
                  brandName: record.brandName,
                  channelType: record.channelType,
                  colorSummary: record.colorSummary,
                  itemCategory: record.itemCategory,
                  marketSignals: record.marketSignals,
                  notes: record.notes,
                  platform: record.platform,
                  primaryColorSummary: record.primaryColorSummary,
                  samplingId: record.samplingId,
                  seasonHint: record.seasonHint,
                  secondaryColorSummary: record.secondaryColorSummary,
                  styleSignals: record.styleSignals,
                  themeKey: record.themeKey,
                  themeLabelZh: record.themeLabelZh,
                })),
              }),
            },
          ],
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const failureMessage = await response.text();

        if (mode === 'model-only') {
          throw new BadRequestException(
            `Model candidate analysis failed: ${failureMessage}`,
          );
        }

        this.logger.warn(`Model candidate analysis skipped: ${failureMessage}`);
        return records;
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const content = payload.choices?.[0]?.message?.content?.trim();

      if (!content) {
        return records;
      }

      const enhancementMap = parseModelEnhancements(content);

      return records.map((record) => {
        const enhancement = enhancementMap.get(record.samplingId);

        if (!enhancement) {
          return record;
        }

        return {
          ...record,
          accentColorSummary:
            enhancement.accentColorSummary?.trim() || record.accentColorSummary,
          colorSummary:
            enhancement.colorSummary
              ?.map((item) => item.trim())
              .filter(Boolean)
              .slice(0, 3) || record.colorSummary,
          marketSignals:
            enhancement.marketSignals?.trim() || record.marketSignals,
          notes: enhancement.notesSuffix?.trim()
            ? buildReviewNote(
                record.notes,
                `AI 分析：${enhancement.notesSuffix.trim()}`,
                false,
              )
            : record.notes,
          primaryColorSummary:
            enhancement.primaryColorSummary?.trim() ||
            record.primaryColorSummary,
          secondaryColorSummary:
            enhancement.secondaryColorSummary?.trim() ||
            record.secondaryColorSummary,
        };
      });
    } catch (error) {
      if (mode === 'model-only') {
        throw error;
      }

      this.logger.warn(
        `Model candidate analysis fallback to rules-only: ${error instanceof Error ? error.message : 'unknown error'}`,
      );

      return records;
    }
  }
}
