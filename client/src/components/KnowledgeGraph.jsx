// client/src/components/KnowledgeGraph.jsx
import React, { useState } from 'react';
import { callGemini, parseGeminiJSON } from '../utils/geminiCaller';

export default function KnowledgeGraph() {
  const [topic, setTopic] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState('');

  const generateGraph = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSelectedNode(null);
    setError('');
    try {
      const result = await callGemini(`
      Generate knowledge graph for: "${topic}"
      
      Return ONLY this exact JSON format:
      {
        "center": "${topic}",
        "nodes": [
          {
            "id": "1",
            "label": "Related concept",
            "type": "country",
            "description": "2 sentence description",
            "connection": "How it connects to ${topic}"
          }
        ]
      }
      
      Include exactly 10 nodes.
      Types must be one of:
      country, company, person, event,
      policy, market, indicator
      Return ONLY JSON, nothing else.
      `, 1500);
      
      const parsed = parseGeminiJSON(result);
      if (parsed) {
        setGraphData(parsed);
      } else {
        setError('Could not generate graph. Try again.');
      }
    } catch (e) {
      console.error('Graph generation error:', e);
      setError('Error generating graph.');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (type) => {
    const colors = {
      country: '#F4A726',    // Gold
      company: '#00C896',    // Emerald
      person: '#4FC3F7',     // Sky Blue
      event: '#FF5252',      // Coral/Red
      policy: '#CE93D8',     // Purple
      market: '#80CBC4',     // Teal
      indicator: '#FFD54F'   // Yellow
    };
    return colors[type] || '#F4A726';
  };

  const handleResearchNode = (nodeLabel) => {
    setTopic(nodeLabel);
    // Automatically trigger graph generation for new node
    setTimeout(() => {
      const btn = document.getElementById('er-graph-trigger-btn');
      if (btn) btn.click();
    }, 100);
  };

  // Coordinates for orbiting nodes in SVG
  const getOrbitalCoordinates = (index, total, radius = 160, centerX = 250, centerY = 200) => {
    const angle = (index * 2 * Math.PI) / total;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const renderSVGGraph = () => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return null;

    const centerX = 250;
    const centerY = 200;
    const totalNodes = graphData.nodes.length;

    return (
      <div className="w-full overflow-x-auto flex justify-center py-4">
        <svg viewBox="0 0 500 400" className="w-full max-w-[650px] aspect-[5/4] select-none">
          {/* Connector Lines */}
          {graphData.nodes.map((node, i) => {
            const coords = getOrbitalCoordinates(i, totalNodes);
            const nodeColor = getNodeColor(node.type);
            return (
              <line
                key={`line-${node.id}`}
                x1={centerX}
                y1={centerY}
                x2={coords.x}
                y2={coords.y}
                stroke={selectedNode?.id === node.id ? nodeColor : 'rgba(255,255,255,0.1)'}
                strokeWidth={selectedNode?.id === node.id ? 2 : 1}
                strokeDasharray={selectedNode?.id === node.id ? 'none' : '4 4'}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Central Hub Node */}
          <circle
            cx={centerX}
            cy={centerY}
            r={30}
            fill="#F4A726"
            className="cursor-pointer filter drop-shadow-[0_0_12px_rgba(244,167,38,0.4)]"
          />
          <text
            x={centerX}
            y={centerY + 4}
            textAnchor="middle"
            fill="#0A1628"
            fontSize="10"
            fontFamily="Inter, sans-serif"
            fontWeight="bold"
            className="pointer-events-none"
          >
            {graphData.center.length > 8 ? `${graphData.center.substring(0, 7)}...` : graphData.center}
          </text>

          {/* Satellite Orbiting Nodes */}
          {graphData.nodes.map((node, i) => {
            const coords = getOrbitalCoordinates(i, totalNodes);
            const nodeColor = getNodeColor(node.type);
            const isSelected = selectedNode?.id === node.id;
            return (
              <g
                key={`node-${node.id}`}
                onClick={() => setSelectedNode(isSelected ? null : node)}
                className="cursor-pointer group"
              >
                {/* Node Circle */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? 18 : 14}
                  fill={isSelected ? nodeColor : '#060D17'}
                  stroke={nodeColor}
                  strokeWidth={2}
                  className="transition-all duration-300 hover:scale-110"
                  style={{
                    filter: isSelected ? `drop-shadow(0 0 8px ${nodeColor}80)` : 'none'
                  }}
                />
                
                {/* Text Label */}
                <text
                  x={coords.x}
                  y={coords.y + 24}
                  textAnchor="middle"
                  fill={isSelected ? '#F4A726' : 'rgba(255,255,255,0.7)'}
                  fontSize="8"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  className="transition-colors duration-300 group-hover:fill-white"
                >
                  {node.label.length > 12 ? `${node.label.substring(0, 10)}...` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-white font-sans min-h-[calc(100vh-140px)]">
      {/* Title Header */}
      <div className="border-b border-[#F4A726]/10 pb-5">
        <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block mb-1">
          conceptual map index
        </span>
        <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-white">
          🕸️ Knowledge Graph
        </h1>
        <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
          Map connections between economic indices, sovereign policies, corporate structures, and geopolitical events.
        </p>
      </div>

      {/* Control Console */}
      <div className="bg-[#0A1628] border border-[#F4A726]/15 rounded-lg p-5 shadow-lg space-y-3">
        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Core Topic</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && generateGraph()}
            placeholder="e.g. India Economy, Federal Reserve, Inflation, Semiconductor Industry..."
            className="flex-grow bg-[#060D17] border border-white/10 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-[#F4A726]/40 transition-colors placeholder:text-gray-500"
          />
          <button
            id="er-graph-trigger-btn"
            onClick={generateGraph}
            disabled={loading}
            className="bg-[#F4A726] hover:bg-[#D48E19] disabled:bg-gray-700 text-[#0A1628] disabled:text-gray-400 font-mono font-bold px-6 py-3 rounded text-xs uppercase tracking-wide transition-all shadow shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Generating Map...' : '🕸️ Generate Graph'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left/Middle: SVG Visual Workspace */}
        <div className="lg:col-span-2 bg-[#0A1628]/40 border border-white/5 rounded-lg p-6 min-h-[460px] flex flex-col justify-center relative overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4A726] mx-auto mb-4"></div>
              <p className="text-xs font-mono text-[#F4A726] uppercase tracking-widest animate-pulse">
                Sieving concept networks via AI...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <span className="text-3xl block mb-3">⚠️</span>
              <p className="text-xs font-mono text-red-400 uppercase tracking-widest">{error}</p>
            </div>
          ) : graphData ? (
            renderSVGGraph()
          ) : (
            <div className="text-center py-20">
              <span className="text-3xl block mb-3">🕸️</span>
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">
                Visualizer Workspace Vacant
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Generate a graph to explore the relational pathways.
              </p>
            </div>
          )}
        </div>

        {/* Right Panel: Node Details & Recursive Research */}
        <div className="space-y-4">
          {graphData && (
            <div className="bg-[#0A1628] border border-white/5 rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold text-[#F4A726] uppercase tracking-widest border-b border-[#F4A726]/10 pb-2">
                Legend
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys({
                  country: 1, company: 1, person: 1, event: 1, policy: 1, market: 1, indicator: 1
                }).map(type => (
                  <span
                    key={type}
                    style={{ borderColor: getNodeColor(type), color: getNodeColor(type) }}
                    className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedNode ? (
            <div
              style={{ borderColor: `${getNodeColor(selectedNode.type)}30` }}
              className="bg-[#0A1628] border rounded-lg p-5 space-y-4"
            >
              <div className="flex justify-between items-start gap-4">
                <h3
                  style={{ color: getNodeColor(selectedNode.type) }}
                  className="font-serif text-base font-bold"
                >
                  {selectedNode.label}
                </h3>
                <span
                  style={{ background: `${getNodeColor(selectedNode.type)}15`, color: getNodeColor(selectedNode.type) }}
                  className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border border-current"
                >
                  {selectedNode.type}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-serif">
                {selectedNode.description}
              </p>
              <div className="bg-white/5 rounded p-3 text-[11px] text-gray-400 font-mono">
                <span className="text-[#F4A726] font-bold">Relational Link: </span>
                {selectedNode.connection}
              </div>
              <button
                onClick={() => handleResearchNode(selectedNode.label)}
                className="w-full bg-[#F4A726]/10 hover:bg-[#F4A726]/20 text-[#F4A726] border border-[#F4A726]/30 py-2.5 rounded text-xs font-mono uppercase tracking-wide cursor-pointer transition-colors"
              >
                🕸️ Research Node
              </button>
            </div>
          ) : graphData && (
            <div className="bg-[#0A1628]/20 border border-white/5 rounded-lg p-6 text-center text-xs text-gray-500">
              Select any orbiting satellite node in the graph viewer to inspect its details and trace relationships.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
