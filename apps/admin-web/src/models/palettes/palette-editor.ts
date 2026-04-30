export interface PaletteEditorOption {
  label: string
  value: string
}

export interface PaletteEditorOptions {
  baseColorOptions: PaletteEditorOption[]
  moodTagOptions: PaletteEditorOption[]
  occasionOptions: PaletteEditorOption[]
  seasonTagOptions: PaletteEditorOption[]
  sourceCollectionOptions: PaletteEditorOption[]
  statusOptions: PaletteEditorOption[]
  styleTagOptions: PaletteEditorOption[]
}