
export enum AspectRatioMode {
    MATCH = '참조 이미지 비율에 맞춤',
    CHANGE = '가로세로 비율 변경',
}

export enum FigurineStyle {
    STANDARD = 'Standard Figurine',
    CHIBI = 'Chibi',
    ACTION_FIGURE = 'Action Figure',
    VINTAGE_TOY = 'Vintage Toy',
}

export enum Material {
    PVC = 'PVC',
    RESIN = 'Resin',
    PLASTIC = 'Plastic',
    PORCELAIN = 'Porcelain',
}

export interface OptionsState {
  aspectRatioMode: AspectRatioMode;
  selectedAspectRatio: string;
  style: FigurineStyle;
  material: Material;
}
