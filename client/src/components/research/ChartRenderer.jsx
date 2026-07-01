import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { createChart } from 'lightweight-charts';

function ChartRenderer({ charts }) {
  const [activeChartIdx, setActiveChartIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL', '1Y', '6M'
  const tvContainerRef = useRef(null);

  if (!charts || !charts.length) return null;

  const currentChart = charts[activeChartIdx];

  // TradingView Lightweight Charts Candle rendering logic
  useEffect(() => {
    if (currentChart?.type !== 'candlestick' || !tvContainerRef.current) return;

    // Clear previous charts
    tvContainerRef.current.innerHTML = '';

    const chart = createChart(tvContainerRef.current, {
      width: tvContainerRef.current.clientWidth,
      height: 280,
      layout: {
        background: { color: '#060D17' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#142B47' },
        horzLines: { color: '#142B47' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#142B47',
      },
      timeScale: {
        borderColor: '#142B47',
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Provide default candlestick mock data if none exists
    const rawData = currentChart.data || [];
    const formattedData = rawData.length ? rawData.map(d => ({
      time: d.time || d.date || d.year,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close)
    })) : [
      { time: '2026-01-01', open: 100, high: 105, low: 98, close: 103 },
      { time: '2026-01-02', open: 103, high: 108, low: 102, close: 107 },
      { time: '2026-01-03', open: 107, high: 107, low: 101, close: 102 },
      { time: '2026-01-04', open: 102, high: 106, low: 100, close: 105 },
    ];

    candlestickSeries.setData(formattedData);

    const handleResize = () => {
      chart.applyOptions({ width: tvContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [currentChart, fullscreen]);

  const getEChartsOption = () => {
    if (!currentChart) return {};

    const rawData = currentChart.data || [];
    const xKey = currentChart.xKey || 'year';
    const yKey = currentChart.yKey || 'value';
    const color = currentChart.color || '#F4A726';

    const xData = rawData.map(d => d[xKey]);
    const yData = rawData.map(d => d[yKey]);

    if (currentChart.type === 'pie' || currentChart.type === 'donut') {
      const pieData = rawData.map(d => ({
        name: d[xKey],
        value: d[yKey]
      }));

      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: `{b}: {c}${currentChart.unit || ''} ({d}%)`
        },
        legend: {
          orient: 'horizontal',
          bottom: '0',
          textStyle: { color: '#9CA3AF', fontSize: 9 }
        },
        series: [
          {
            name: currentChart.title,
            type: 'pie',
            radius: currentChart.type === 'donut' ? ['40%', '70%'] : '70%',
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 4,
              borderColor: '#060D17',
              borderWidth: 2
            },
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 10,
                fontWeight: 'bold',
                color: '#FFFFFF'
              }
            },
            data: pieData
          }
        ]
      };
    }

    // Line / Bar / Area Chart options
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#142B47' } }
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '8%',
        top: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: '#142B47' } },
        axisLabel: { color: '#9CA3AF', fontSize: 9 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#142B47' } },
        splitLine: { lineStyle: { color: '#142B47', type: 'dashed' } },
        axisLabel: { color: '#9CA3AF', fontSize: 9, formatter: `{value}${currentChart.unit || ''}` },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', show: false }
      ],
      series: [
        {
          name: currentChart.title,
          type: currentChart.type === 'bar' ? 'bar' : 'line',
          data: yData,
          smooth: true,
          itemStyle: { color },
          areaStyle: currentChart.type === 'area' ? {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, stopColor: color },
                { offset: 1, stopColor: 'transparent' }
              ]
            }
          } : undefined
        }
      ]
    };
  };

  return (
    <div className={`w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg ${fullscreen ? 'fixed inset-4 z-50 overflow-auto bg-[#0A1628]/95' : 'relative'}`}>
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#F4A726]/10 pb-3">
        <div className="flex gap-2 items-center flex-wrap">
          {charts.map((c, idx) => (
            <button
              key={idx}
              onClick={() => setActiveChartIdx(idx)}
              className={`px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded border ${
                activeChartIdx === idx 
                  ? 'bg-[#F4A726] border-[#F4A726] text-navy' 
                  : 'bg-[#060D17] border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {c.title?.slice(0, 20) || `Chart ${idx + 1}`}
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end items-center">
          {/* Zoom/Filter controls */}
          <div className="flex bg-[#060D17] rounded border border-white/5 p-0.5">
            {['ALL', '1Y', '6M'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2 py-0.5 text-[8px] font-mono rounded font-bold ${
                  dateRange === range ? 'bg-[#142B47] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1 bg-[#060D17] border border-white/5 rounded text-gray-400 hover:text-white text-[9px] uppercase font-mono font-bold"
            title="Toggle Fullscreen"
          >
            {fullscreen ? 'Close' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="bg-[#060D17] rounded-md p-3 border border-white/5 relative min-h-[290px] flex items-center justify-center">
        {currentChart?.type === 'candlestick' ? (
          <div ref={tvContainerRef} className="w-full h-[280px]"></div>
        ) : (
          <ReactECharts
            option={getEChartsOption()}
            style={{ height: '280px', width: '100%' }}
            theme="dark"
            lazyUpdate={true}
          />
        )}
      </div>

      {/* Chart explanation */}
      {currentChart?.description && (
        <p className="mt-3.5 text-[10px] font-mono text-gray-450 leading-relaxed uppercase tracking-wider">
          📊 Note: {currentChart.description}
        </p>
      )}
    </div>
  );
}

export default React.memo(ChartRenderer);
