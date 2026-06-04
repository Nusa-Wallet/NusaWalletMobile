import React from "react";
import { View } from "react-native";

interface Props {
  data: number[];
  color?: string;
  width: number;
  height?: number;
}

/**
 * Pure React Native line chart — no SVG dependency, works on web + native.
 * Dots are absolutely positioned Views; connecting lines are thin rotated Views.
 */
export function MiniChart({ data, color = "#2563EB", width, height = 72 }: Props) {
  if (data.length < 2) return null;

  const pad = 10;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * chartW,
    y: pad + chartH - ((v - min) / range) * chartH,
  }));

  return (
    <View style={{ width, height }}>
      {/* Connecting lines */}
      {pts.slice(0, -1).map((p, i) => {
        const nx = pts[i + 1].x;
        const ny = pts[i + 1].y;
        const dx = nx - p.x;
        const dy = ny - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={`l${i}`}
            style={{
              position: "absolute",
              width: len,
              height: 2.5,
              backgroundColor: color,
              left: (p.x + nx) / 2 - len / 2,
              top: (p.y + ny) / 2 - 1.25,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Dots */}
      {pts.map((p, i) => (
        <View
          key={`d${i}`}
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            left: p.x - 4,
            top: p.y - 4,
          }}
        />
      ))}
    </View>
  );
}
