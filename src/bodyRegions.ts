export type BodySide = 'front' | 'back';
// Region names are present in Endolog 1.3.10's Hermes string table.
// Geometry is a reconstruction, not extracted original artwork.
export const bodyRegions: {name: string; side: BodySide; path: string}[] = [
  {name: 'Head', side: 'front', path: 'M85 26 C85 1 115 1 115 26 C115 52 85 52 85 26Z'},
  {name: 'Neck', side: 'front', path: 'M91 48 L109 48 L113 63 L87 63Z'},
  {name: 'Chest', side: 'front', path: 'M87 63 L113 63 L133 71 L127 112 Q100 124 73 112 L67 71Z'},
  {name: 'Abdomen', side: 'front', path: 'M73 115 Q100 126 127 115 L123 150 L77 150Z'},
  {name: 'Lower Abdomen', side: 'front', path: 'M77 153 L123 153 L130 177 Q100 194 70 177Z'},
  {name: 'Pelvis', side: 'front', path: 'M70 180 Q100 198 130 180 L130 200 L100 222 L70 200Z'},
  {name: 'Head', side: 'back', path: 'M85 26 C85 1 115 1 115 26 C115 52 85 52 85 26Z'},
  {name: 'Neck', side: 'back', path: 'M91 48 L109 48 L113 63 L87 63Z'},
  {name: 'Upper back', side: 'back', path: 'M87 63 L113 63 L133 71 L127 128 L73 128 L67 71Z'},
  {name: 'Lower back', side: 'back', path: 'M73 131 L127 131 L123 153 L130 177 Q100 187 70 177 L77 153Z'},
  {name: 'Buttocks', side: 'back', path: 'M70 180 Q100 190 130 180 L130 213 Q113 226 100 214 Q87 226 70 213Z'},
  ...(['front', 'back'] as const).flatMap(side => [
    {name: 'Arms', side, path: 'M64 73 L53 80 L37 151 L28 187 L39 191 L54 156 L69 109Z M136 73 L147 80 L163 151 L172 187 L161 191 L146 156 L131 109Z'},
    {name: 'Hands', side, path: 'M28 190 L39 194 L34 218 Q25 229 21 215Z M172 190 L161 194 L166 218 Q175 229 179 215Z'},
    {name: 'Thigh', side, path: 'M70 216 L97 226 L94 283 L73 283Z M103 226 L130 216 L127 283 L106 283Z'},
    {name: 'Calf', side, path: 'M73 286 L94 286 L90 345 L78 345Z M106 286 L127 286 L122 345 L110 345Z'},
    {name: 'Feet', side, path: 'M78 348 L90 348 L91 362 L70 362 Q68 357 78 348Z M110 348 L122 348 Q132 357 130 362 L109 362Z'},
  ]),
];

export function toggleBodyRegion(selected: string[], name: string): string[] {
  return selected.includes(name) ? selected.filter(value => value !== name) : [...selected, name];
}
