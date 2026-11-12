import Svg, { Path } from 'react-native-svg';

// The artboards' 18px close cross (Add product header, reused on the scanner).
export function CloseIcon({ color }: { color: string }) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      <Path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}
