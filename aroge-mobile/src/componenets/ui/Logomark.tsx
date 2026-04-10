import React from 'react';
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Rect,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface LogoMarkProps {
  size?: number;
  color?: string;
  accentColor?: string;
  showRing?: boolean;
}

/**
 * Aroge logo mark: A geometric arch representing a marketplace entrance.
 * The arch (ሰ arc shape) evokes both the Latin 'A' and Ethiopian architectural arches.
 * The inner ring in gold grounds it as a mark of value.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 80,
  color = '#f3efe7',
  accentColor = '#c89b3c',
  showRing = true,
}) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <Svg width={s} height={s} viewBox="0 0 80 80">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={accentColor} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={accentColor} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Outer ring */}
      {showRing && (
        <Circle
          cx={40}
          cy={40}
          r={36}
          fill="none"
          stroke={accentColor}
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.5}
        />
      )}

      {/* Inner subtle circle */}
      <Circle cx={40} cy={40} r={30} fill={`${accentColor}10`} />

      {/* Arch left leg */}
      <Path
        d="M 22 58 L 22 34 Q 22 18 40 18 Q 58 18 58 34 L 58 58"
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cross bar */}
      <Line
        x1={27}
        y1={42}
        x2={53}
        y2={42}
        stroke={accentColor}
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* Keystone dot at apex */}
      <Circle cx={40} cy={20} r={3} fill={accentColor} />
    </Svg>
  );
};

/**
 * Wordmark: "AROGE" in all-caps with wide tracking.
 * Used alongside LogoMark on the splash and auth screens.
 */
export const LogoWordmark: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'display';
  color?: string;
}> = ({ size = 'md', color = '#f3efe7' }) => {
  // Rendered as a Text component — imported separately in screen files
  return null; // Actual text rendered via Text in screens for better font control
};