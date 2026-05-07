export interface PaletteEditorOption {
  label: string
  value: string
}

export interface PaletteEditorOptions {
  baseColorOptions: PaletteEditorOption[]
  moodTagOptions: PaletteEditorOption[]
  occasionOptions: PaletteEditorOption[]
  referenceChannelTypeOptions: PaletteEditorOption[]
  referenceMethodOptions: PaletteEditorOption[]
  reviewStatusOptions: PaletteEditorOption[]
  seasonTagOptions: PaletteEditorOption[]
  sourceCollectionOptions: PaletteEditorOption[]
  statusOptions: PaletteEditorOption[]
  styleTagOptions: PaletteEditorOption[]
}