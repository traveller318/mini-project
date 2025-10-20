import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

interface PieChartData {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

interface AnimatedPieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
}

const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({
  data,
  size = 200,
  strokeWidth = 0,
  showLabels = true,
}) => {
  const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;
  const rotationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start rotation animation
    Animated.timing(rotationValue, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Animate each slice
    animatedValues.forEach((animValue, index) => {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 1000 + index * 200,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const createPath = (
    startAngle: number,
    endAngle: number,
    radius: number,
    centerX: number,
    centerY: number
  ) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', centerX, centerY,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  let cumulativePercentage = 0;

  const AnimatedPath = Animated.createAnimatedComponent(Path);

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View
        style={{
          transform: [{
            rotate: rotationValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          }],
        }}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>
            {data.map((item, index) => {
              const startAngle = (cumulativePercentage / 100) * 360;
              const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
              
              const pathData = createPath(startAngle, endAngle, radius, center, center);
              cumulativePercentage += item.percentage;

              // Calculate the mid-point angle to place text in the middle of each slice
              const midAngle = (startAngle + endAngle) / 2;
              const textX = center + (radius * 0.65 * Math.cos((midAngle - 90) * Math.PI / 180));
              const textY = center + (radius * 0.65 * Math.sin((midAngle - 90) * Math.PI / 180));
              
              // Only show percentage labels for slices that are big enough
              const shouldShowLabel = item.percentage >= 5;

              return (
                <React.Fragment key={item.name}>
                  <AnimatedPath
                    d={pathData}
                    fill={item.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={animatedValues[index]}
                  />
                  {shouldShowLabel && (
                    <Animated.View
                      style={{
                        opacity: animatedValues[index],
                        position: 'absolute',
                        left: 0,
                        top: 0,
                      }}
                    >
                      <SvgText
                        x={textX}
                        y={textY}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="#FFFFFF"
                      >
                        {`${item.percentage}%`}
                      </SvgText>
                    </Animated.View>
                  )}
                </React.Fragment>
              );
            })}
          </G>
        </Svg>
      </Animated.View>

      {/* Legend */}
      <View style={{ marginTop: 20, width: '100%' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          {data.map((item, index) => (
            <Animated.View
              key={item.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 8,
                marginVertical: 4,
                opacity: animatedValues[index],
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: item.color,
                  borderRadius: 6,
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 11, color: '#4B5563', fontWeight: '500' }}>
                {item.name.length > 10 ? `${item.name.substring(0, 10)}...` : item.name}
              </Text>
              <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 2 }}>
                ({item.percentage}%)
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default AnimatedPieChart;