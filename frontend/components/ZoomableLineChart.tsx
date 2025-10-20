import React, { useRef, useState } from 'react';
import { View, PanResponder, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface ZoomableLineChartProps {
  data: any;
  width: number;
  height: number;
  chartConfig: any;
  bezier?: boolean;
  style?: any;
  withHorizontalLabels?: boolean;
  withVerticalLabels?: boolean;
  withDots?: boolean;
  withShadow?: boolean;
  withInnerLines?: boolean;
  segments?: number;
  fromZero?: boolean;
  formatXLabel?: (value: string) => string;
  yLabelsOffset?: number;
}

const ZoomableLineChart: React.FC<ZoomableLineChartProps> = (props) => {
  const [scale, setScale] = useState(1);
  const lastScale = useRef(1);
  const baseScale = useRef(1);
  const pinchDistance = useRef(0);
  const animatedScale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Save the initial distance between two touches
          const dx = evt.nativeEvent.touches[0].locationX - evt.nativeEvent.touches[1].locationX;
          const dy = evt.nativeEvent.touches[0].locationY - evt.nativeEvent.touches[1].locationY;
          pinchDistance.current = Math.sqrt(dx * dx + dy * dy);
        }
      },
      
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Calculate the new distance between touches
          const dx = evt.nativeEvent.touches[0].locationX - evt.nativeEvent.touches[1].locationX;
          const dy = evt.nativeEvent.touches[0].locationY - evt.nativeEvent.touches[1].locationY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate the new scale
          let newScale = lastScale.current * (distance / pinchDistance.current);
          
          // Limit scaling
          newScale = Math.min(Math.max(newScale, 0.5), 2);
          
          setScale(newScale);
          animatedScale.setValue(newScale);
        }
      },
      
      onPanResponderRelease: () => {
        lastScale.current = scale;
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [{ scale: animatedScale }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LineChart {...props} />
    </Animated.View>
  );
};

export default ZoomableLineChart;