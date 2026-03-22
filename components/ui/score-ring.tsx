import { StyleSheet, Text, View } from 'react-native'
import { Colors, FontSize, FontWeight } from '@/constants/theme'

type Props = {
  score: number   // 0–100
  size?: number
}

/**
 * Circular protection score indicator using the two-half-circle technique.
 * No SVG dependency required.
 */
export function ScoreRing({ score, size = 130 }: Props) {
  const half = size / 2
  const borderW = size * 0.072
  const innerSize = size - borderW * 2
  const clampedScore = Math.min(100, Math.max(0, score))

  // Split 360° into two halves. Fill right half first, then left.
  const rightDeg = clampedScore >= 50
    ? 180
    : (clampedScore / 50) * 180

  const leftDeg = clampedScore > 50
    ? ((clampedScore - 50) / 50) * 180
    : 0

  const scoreColor = clampedScore >= 75
    ? Colors.success
    : clampedScore >= 50
    ? Colors.warning
    : Colors.danger

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Track ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: borderW,
            borderColor: 'rgba(255,255,255,0.12)',
          },
        ]}
      />

      {/* Right half fill */}
      <View
        style={[
          styles.halfContainer,
          { width: half, height: size, left: half },
        ]}
      >
        <View
          style={[
            styles.half,
            {
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: borderW,
              borderColor: scoreColor,
              transform: [{ rotate: `${rightDeg - 180}deg` }],
            },
          ]}
        />
      </View>

      {/* Left half fill */}
      <View
        style={[
          styles.halfContainer,
          { width: half, height: size, left: 0 },
        ]}
      >
        <View
          style={[
            styles.half,
            {
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: borderW,
              borderColor: leftDeg > 0 ? scoreColor : 'transparent',
              transform: [{ rotate: `${leftDeg}deg` }],
            },
          ]}
        />
      </View>

      {/* Inner label */}
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            top: borderW,
            left: borderW,
          },
        ]}
      >
        <Text style={[styles.scoreNum, { color: scoreColor }]}>{clampedScore}</Text>
        <Text style={styles.scoreLabel}>/ 100</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  halfContainer: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  half: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  inner: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    lineHeight: FontSize.xxl + 4,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: FontWeight.medium,
  },
})
