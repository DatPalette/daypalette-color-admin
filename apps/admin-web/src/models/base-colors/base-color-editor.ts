export interface BaseColorEditorOption {
  label: string
  value: string
}

export interface BaseColorEditorOptions {
  colorFamilies: BaseColorEditorOption[]
  lightnessLevels: BaseColorEditorOption[]
  occasionTags: BaseColorEditorOption[]
  saturationLevels: BaseColorEditorOption[]
  seasonTags: BaseColorEditorOption[]
  statuses: BaseColorEditorOption[]
  styleTags: BaseColorEditorOption[]
  tones: BaseColorEditorOption[]
}