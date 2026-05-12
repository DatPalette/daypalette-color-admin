import type {
  OutfitPreviewBottomTemplate,
  OutfitPreviewColorToken,
  OutfitPreviewDressTemplate,
  OutfitPreviewSlot,
  OutfitPreviewTemplateDefinition,
  OutfitPreviewTemplateId,
  OutfitPreviewTopTemplate,
} from './outfit-preview.types'

function createTemplateMap<TemplateId extends OutfitPreviewTemplateId>(
  templates: OutfitPreviewTemplateDefinition<TemplateId>[],
): Record<TemplateId, OutfitPreviewTemplateDefinition<TemplateId>> {
  return templates.reduce(
    (accumulator, template) => {
      accumulator[template.id] = template
      return accumulator
    },
    {} as Record<TemplateId, OutfitPreviewTemplateDefinition<TemplateId>>,
  )
}

function createSurface(id: string, slot: OutfitPreviewSlot, path: string, opacity?: number) {
  return { id, opacity, path, slot }
}

export const outfitPreviewFallbackColors: Record<OutfitPreviewSlot, OutfitPreviewColorToken> = {
  accent: { hex: '#CCB79E', label: '点缀色' },
  main: { hex: '#F3EEE6', label: '主色' },
  secondary: { hex: '#A9B7C4', label: '次色' },
}

export const outfitPreviewDefaults = {
  bottomTemplate: 'trousers' as OutfitPreviewBottomTemplate,
  dressTemplate: 'midi-dress' as OutfitPreviewDressTemplate,
  topTemplate: 'short-sleeve' as OutfitPreviewTopTemplate,
}

export const outfitPreviewTopTemplates: OutfitPreviewTemplateDefinition<OutfitPreviewTopTemplate>[] = [
  {
    id: 'long-sleeve',
    label: '长袖上衣',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'main', 'M92 96 C100 88 109 84 120 84 C131 84 140 88 148 96 L162 108 C169 114 171 124 168 133 L160 152 L155 194 C145 199 133 202 120 202 C107 202 95 199 85 194 L80 152 L72 133 C69 124 71 114 78 108 Z'),
      createSurface('panel', 'secondary', 'M100 98 C107 92 113 90 120 90 C127 90 133 92 140 98 L146 122 L143 188 C136 192 129 194 120 194 C111 194 104 192 97 188 L94 122 Z', 0.98),
      createSurface('trim', 'accent', 'M108 92 C113 97 117 100 120 100 C123 100 127 97 132 92 L136 100 C131 107 126 111 120 111 C114 111 109 107 104 100 Z M73 126 C78 123 83 123 87 126 L84 158 C79 160 75 160 71 157 Z M153 126 C157 123 162 123 167 126 L169 157 C165 160 161 160 156 158 Z'),
    ],
  },
  {
    id: 'short-sleeve',
    label: '短袖上衣',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'main', 'M94 96 C102 88 110 84 120 84 C130 84 138 88 146 96 L157 106 C163 111 164 118 161 125 L154 136 C148 138 143 137 139 132 L143 186 C136 190 128 192 120 192 C112 192 104 190 97 186 L101 132 C97 137 92 138 86 136 L79 125 C76 118 77 111 83 106 Z'),
      createSurface('panel', 'secondary', 'M101 99 C107 93 113 91 120 91 C127 91 133 93 139 99 L143 121 L140 180 C134 184 127 186 120 186 C113 186 106 184 100 180 L97 121 Z', 0.98),
      createSurface('trim', 'accent', 'M108 92 C112 97 116 100 120 100 C124 100 128 97 132 92 L136 100 C131 107 126 110 120 110 C114 110 109 107 104 100 Z M80 116 C85 115 89 115 94 118 L91 129 C87 130 83 130 79 128 Z M146 118 C151 115 155 115 160 116 L161 128 C157 130 153 130 149 129 Z'),
    ],
  },
  {
    id: 'camisole',
    label: '吊带上衣',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'main', 'M98 100 C104 93 111 90 120 90 C129 90 136 93 142 100 L146 118 L143 178 C136 183 129 186 120 186 C111 186 104 183 97 178 L94 118 Z'),
      createSurface('panel', 'secondary', 'M104 112 C109 107 114 105 120 105 C126 105 131 107 136 112 L138 170 C132 174 126 176 120 176 C114 176 108 174 102 170 Z', 0.98),
      createSurface('trim', 'accent', 'M98 98 C101 91 104 87 108 86 L109 119 C106 118 103 118 100 119 Z M132 86 C136 87 139 91 142 98 L140 119 C137 118 134 118 131 119 Z M108 101 C112 107 116 110 120 110 C124 110 128 107 132 101'),
    ],
  },
  {
    id: 'shirt',
    label: '衬衫',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'main', 'M90 96 C98 88 108 84 120 84 C132 84 142 88 150 96 L163 109 C168 114 170 121 168 128 L161 144 L156 192 C146 197 134 200 120 200 C106 200 94 197 84 192 L79 144 L72 128 C70 121 72 114 77 109 Z'),
      createSurface('panel', 'secondary', 'M100 98 L117 112 L120 106 L123 112 L140 98 L144 122 L141 188 C134 192 127 194 120 194 C113 194 106 192 99 188 L96 122 Z', 0.98),
      createSurface('trim', 'accent', 'M100 95 L114 108 L120 102 L126 108 L140 95 L136 111 L124 118 V194 H116 V118 L104 111 Z'),
    ],
  },
  {
    id: 'outerwear',
    label: '外套',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'main', 'M86 96 C95 87 107 82 120 82 C133 82 145 87 154 96 L170 112 C177 118 179 128 175 138 L164 156 L157 198 C146 204 134 207 120 207 C106 207 94 204 83 198 L76 156 L65 138 C61 128 63 118 70 112 Z'),
      createSurface('panel', 'secondary', 'M102 100 C108 94 114 92 120 92 C126 92 132 94 138 100 L142 124 L139 192 C133 196 126 198 120 198 C114 198 107 196 101 192 L98 124 Z', 0.98),
      createSurface('trim', 'accent', 'M88 100 C92 98 96 97 100 98 L99 190 C95 192 91 192 87 190 Z M140 98 C144 97 148 98 152 100 L153 190 C149 192 145 192 141 190 Z M99 100 H141 V109 H99 Z'),
    ],
  },
]

export const outfitPreviewBottomTemplates: OutfitPreviewTemplateDefinition<OutfitPreviewBottomTemplate>[] = [
  {
    id: 'trousers',
    label: '长裤',
    mode: 'separates',
    surfaces: [
      createSurface('legs', 'secondary', 'M94 182 C104 176 112 174 120 174 C128 174 136 176 146 182 L149 196 C145 232 142 270 141 308 C136 312 131 313 126 311 L121 236 H119 L114 311 C109 313 104 312 99 308 C98 270 95 232 91 196 Z'),
      createSurface('panel', 'main', 'M103 184 C109 180 114 178 120 178 C126 178 131 180 137 184 L132 306 C128 308 124 309 120 309 C116 309 112 308 108 306 Z', 0.98),
      createSurface('waist', 'accent', 'M95 180 C104 176 112 175 120 175 C128 175 136 176 145 180 L143 189 C135 192 127 193 120 193 C113 193 105 192 97 189 Z'),
    ],
  },
  {
    id: 'shorts',
    label: '短裤',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'secondary', 'M95 181 C104 176 112 174 120 174 C128 174 136 176 145 181 L149 194 L143 218 C138 224 133 228 126 230 L122 214 H118 L114 230 C107 228 102 224 97 218 L91 194 Z'),
      createSurface('panel', 'main', 'M104 185 C109 181 114 179 120 179 C126 179 131 181 136 185 L138 216 C132 220 126 222 120 222 C114 222 108 220 102 216 Z', 0.98),
      createSurface('waist', 'accent', 'M96 181 C104 177 112 176 120 176 C128 176 136 177 144 181 L142 189 C135 191 128 192 120 192 C112 192 105 191 98 189 Z'),
    ],
  },
  {
    id: 'mini-skirt',
    label: '短裙',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'secondary', 'M96 181 C104 177 112 175 120 175 C128 175 136 177 144 181 L155 222 C145 228 133 231 120 231 C107 231 95 228 85 222 Z'),
      createSurface('panel', 'main', 'M104 188 C109 184 114 182 120 182 C126 182 131 184 136 188 L143 214 C136 218 128 220 120 220 C112 220 104 218 97 214 Z', 0.98),
      createSurface('waist', 'accent', 'M97 181 C104 178 112 177 120 177 C128 177 136 178 143 181 L141 189 C134 191 127 192 120 192 C113 192 106 191 99 189 Z'),
    ],
  },
  {
    id: 'midi-skirt',
    label: '中长裙',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'secondary', 'M96 181 C104 177 112 175 120 175 C128 175 136 177 144 181 L160 268 C148 276 134 280 120 280 C106 280 92 276 80 268 Z'),
      createSurface('panel', 'main', 'M104 188 C109 184 114 182 120 182 C126 182 131 184 136 188 L149 254 C140 260 130 263 120 263 C110 263 100 260 91 254 Z', 0.98),
      createSurface('waist', 'accent', 'M97 181 C104 178 112 177 120 177 C128 177 136 178 143 181 L141 189 C134 191 127 192 120 192 C113 192 106 191 99 189 Z'),
    ],
  },
  {
    id: 'maxi-skirt',
    label: '长裙',
    mode: 'separates',
    surfaces: [
      createSurface('body', 'secondary', 'M96 181 C104 177 112 175 120 175 C128 175 136 177 144 181 L162 304 C150 313 136 317 120 317 C104 317 90 313 78 304 Z'),
      createSurface('panel', 'main', 'M105 188 C110 184 115 182 120 182 C125 182 130 184 135 188 L150 290 C141 297 131 300 120 300 C109 300 99 297 90 290 Z', 0.98),
      createSurface('waist', 'accent', 'M97 181 C104 178 112 177 120 177 C128 177 136 178 143 181 L141 189 C134 191 127 192 120 192 C113 192 106 191 99 189 Z'),
    ],
  },
]

export const outfitPreviewDressTemplates: OutfitPreviewTemplateDefinition<OutfitPreviewDressTemplate>[] = [
  {
    id: 'mini-dress',
    label: '短连衣裙',
    mode: 'dress',
    surfaces: [
      createSurface('body', 'main', 'M92 96 C100 88 109 84 120 84 C131 84 140 88 148 96 L160 108 C166 114 168 122 166 129 L160 144 L170 220 C158 229 140 234 120 234 C100 234 82 229 70 220 L80 144 L74 129 C72 122 74 114 80 108 Z'),
      createSurface('panel', 'secondary', 'M101 99 C107 93 113 91 120 91 C127 91 133 93 139 99 L145 123 L151 208 C142 214 131 217 120 217 C109 217 98 214 89 208 L95 123 Z', 0.98),
      createSurface('trim', 'accent', 'M108 92 C113 98 117 101 120 101 C123 101 127 98 132 92 L136 100 C131 108 126 112 120 112 C114 112 109 108 104 100 Z M93 160 C102 157 111 156 120 156 C129 156 138 157 147 160 L145 170 C137 173 129 174 120 174 C111 174 103 173 95 170 Z'),
    ],
  },
  {
    id: 'midi-dress',
    label: '中长连衣裙',
    mode: 'dress',
    surfaces: [
      createSurface('body', 'main', 'M92 96 C100 88 109 84 120 84 C131 84 140 88 148 96 L160 108 C166 114 168 122 166 129 L160 144 L171 286 C158 296 141 301 120 301 C99 301 82 296 69 286 L80 144 L74 129 C72 122 74 114 80 108 Z'),
      createSurface('panel', 'secondary', 'M101 99 C107 93 113 91 120 91 C127 91 133 93 139 99 L145 124 L153 269 C144 276 132 280 120 280 C108 280 96 276 87 269 L95 124 Z', 0.98),
      createSurface('trim', 'accent', 'M108 92 C113 98 117 101 120 101 C123 101 127 98 132 92 L136 100 C131 108 126 112 120 112 C114 112 109 108 104 100 Z M93 162 C102 159 111 158 120 158 C129 158 138 159 147 162 L145 172 C137 175 129 176 120 176 C111 176 103 175 95 172 Z'),
    ],
  },
  {
    id: 'maxi-dress',
    label: '长连衣裙',
    mode: 'dress',
    surfaces: [
      createSurface('body', 'main', 'M92 96 C100 88 109 84 120 84 C131 84 140 88 148 96 L160 108 C166 114 168 122 166 129 L160 144 L173 309 C160 320 142 326 120 326 C98 326 80 320 67 309 L80 144 L74 129 C72 122 74 114 80 108 Z'),
      createSurface('panel', 'secondary', 'M101 99 C107 93 113 91 120 91 C127 91 133 93 139 99 L145 124 L154 293 C145 301 133 306 120 306 C107 306 95 301 86 293 L95 124 Z', 0.98),
      createSurface('trim', 'accent', 'M108 92 C113 98 117 101 120 101 C123 101 127 98 132 92 L136 100 C131 108 126 112 120 112 C114 112 109 108 104 100 Z M93 162 C102 159 111 158 120 158 C129 158 138 159 147 162 L145 172 C137 175 129 176 120 176 C111 176 103 175 95 172 Z'),
    ],
  },
]

export const outfitPreviewTopTemplateMap = createTemplateMap(outfitPreviewTopTemplates)
export const outfitPreviewBottomTemplateMap = createTemplateMap(outfitPreviewBottomTemplates)
export const outfitPreviewDressTemplateMap = createTemplateMap(outfitPreviewDressTemplates)