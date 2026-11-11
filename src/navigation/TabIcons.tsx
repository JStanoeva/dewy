import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = {
  color: string;
};

const SIZE = 24;
const STROKE = 1.8;

export function SunIcon({ color }: IconProps) {
  return (
    <Svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
    >
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon({ color }: IconProps) {
  return (
    <Svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Svg>
  );
}

export function BottleIcon({ color, size = SIZE }: IconProps & { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M9 3h6v3l2 2v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8l2-2z" />
      <Path d="M7 12h10" />
    </Svg>
  );
}

export function ListIcon({ color }: IconProps) {
  return (
    <Svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
    >
      <Path d="M9 6h11M9 12h11M9 18h11" />
      <Path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth={2.6} />
    </Svg>
  );
}

export function PersonIcon({ color }: IconProps) {
  return (
    <Svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
    >
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  );
}

export function PlusIcon({ color }: IconProps) {
  return (
    <Svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}
