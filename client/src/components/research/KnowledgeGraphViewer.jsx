import React, { useState, useEffect, useRef } from 'react';

const NODE_COLORS = {
  country: '#EF4444',     // Red
  company: '#3B82F6',     // Blue
  industry: '#10B981',    // Green
  government: '#8B5CF6',  // Purple
  policy: '#EC4899',      // Pink
  technology: '#F59E0B',  // Amber
  indicator: '#6366F1',   // Indigo
  institution: '#F4A726', // Gold
  entity: '#6B7280',      // Gray
};

export default function KnowledgeGraphViewer({ graphData }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef(null);
  const [viewBox, setViewBox] = useState('0 0 800 500');

  useEffect(() => {
    if (!graphData || !graphData.nodes) return;

    // Layout calculation (circle + random offset to spread nodes beautifully)
    const center = { x: 400, y: 250 };
    const radius = 180;
    
    const formattedNodes = graphData.nodes.map((node, idx) => {
      // Calculate angular positions
      const angle = (idx / graphData.nodes.length) * 2 * Math.PI;
      const x = center.x + radius * Math.cos(angle) + (Math.random() - 0.5) * 40;
      const y = center.y + radius * Math.sin(angle) + (Math.random() - 0.5) * 40;

      return {
        ...node,
        x,
        y,
        r: 18 + Math.min(node.researchCount || 1, 10) * 1.5,
      };
    });

    // Generate edges between nodes sharing similar properties or types
    const formattedEdges = [];
    for (let i = 0; i < formattedNodes.length; i++) {
      for (let j = i + 1; j < formattedNodes.length; j++) {
        const source = formattedNodes[i];
        const target = formattedNodes[j];
        
        // Connect if same type or sharing reports
        const shareReport = (source.reportIds || []).some(id => (target.reportIds || []).includes(id));
        if (source.type === target.type || shareReport) {
          formattedEdges.push({
            id: `edge-${source.id}-${target.id}`,
            source,
            target,
            strength: shareReport ? 0.8 : 0.3,
          });
        }
      }
    }

    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, [graphData]);

  const triggerDeepResearch = (node) => {
    const queryStr = `${node.name} economic market analysis and policy outlook`;
    
    // Dispatch events to change view and prefill input
    window.dispatchEvent(new CustomEvent('change-view', {
      detail: 'er-research'
    }));

    window.dispatchEvent(new CustomEvent('er-research-prefill', {
      detail: {
        query: queryStr,
        entityId: node.id,
        entityType: node.type || 'entity',
        fromGraph: true
      }
    }));
  };

  const filteredNodes = nodes.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#0A1628] border border-[#F4A726]/10 rounded-lg p-5 font-sans shadow-lg flex flex-col md:flex-row gap-5">
      
      {/* Sidebar: Details & Action */}
      <div className="w-full md:w-64 shrink-0 flex flex-col justify-between space-y-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#F4A726] uppercase tracking-widest block">
            interactive intelligence ledger
          </span>
          <h3 className="font-serif text-base font-black text-white uppercase tracking-tight mt-1">
            Global Entity Knowledge Graph
          </h3>
          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
            Click nodes to explore economic linkages and launch direct Deep Research jobs on specific institutions, commodities, or policy frameworks.
          </p>
        </div>

        {/* Node search */}
        <div>
          <input
            type="text"
            placeholder="Search entity node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060D17] border border-[#F4A726]/15 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#F4A726]/40 font-mono"
          />
        </div>

        {/* Details card */}
        <div className="bg-[#060D17] border border-white/5 rounded p-4 flex-grow flex flex-col justify-between min-h-[160px]">
          {selectedNode ? (
            <div className="space-y-3 flex flex-col justify-between h-full">
              <div className="space-y-1.5">
                <span 
                  className="text-[8px] font-mono font-bold px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.type] || '#6B7280' }}
                >
                  {selectedNode.type?.toUpperCase() || 'ENTITY'}
                </span>
                <h4 className="font-serif text-sm font-black text-white uppercase tracking-tight">
                  {selectedNode.name}
                </h4>
                <p className="text-[10px] text-gray-400 font-mono">
                  Research Mentions: {selectedNode.researchCount || 1}
                </p>
              </div>

              <button
                onClick={() => triggerDeepResearch(selectedNode)}
                className="w-full bg-[#F4A726] hover:bg-[#D48E19] text-navy font-bold py-2 rounded text-xs uppercase tracking-wide transition-colors duration-200 mt-2"
              >
                🔬 Deep Research
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full py-8 text-gray-500 text-[10px] uppercase font-mono tracking-wider">
              <span>Select any node web point to unlock data actions</span>
            </div>
          )}
        </div>
      </div>

      {/* Main SVG Graph */}
      <div ref={containerRef} className="flex-grow bg-[#060D17] rounded-md border border-white/5 relative overflow-hidden h-[380px] md:h-[420px]">
        
        {/* Graph rendering */}
        <svg className="w-full h-full" viewBox={viewBox}>
          <defs>
            <radialGradient id="graphGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#142B47" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#060D17" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background glowing circle */}
          <circle cx="400" cy="250" r="280" fill="url(#graphGlow)" />

          {/* Draw edges (links) */}
          <g>
            {edges.map((edge) => {
              const isLinkedToHovered = hoveredNode && 
                (edge.source.id === hoveredNode.id || edge.target.id === hoveredNode.id);
              
              return (
                <line
                  key={edge.id}
                  x1={edge.source.x}
                  y1={edge.source.y}
                  x2={edge.target.x}
                  y2={edge.target.y}
                  stroke={isLinkedToHovered ? '#F4A726' : '#142B47'}
                  strokeWidth={isLinkedToHovered ? 1.5 : 0.8}
                  strokeOpacity={isLinkedToHovered ? 0.75 : 0.3}
                  className="transition-all duration-300"
                />
              );
            })}
          </g>

          {/* Draw nodes */}
          <g>
            {filteredNodes.map((node) => {
              const isSelected = selectedNode && selectedNode.id === node.id;
              const isHovered = hoveredNode && hoveredNode.id === node.id;
              const color = NODE_COLORS[node.type] || '#6B7280';

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer glow rings for selection */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 4}
                      fill="none"
                      stroke="#F4A726"
                      strokeWidth={1.5}
                      className="animate-pulse"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                    fill="#0A1628"
                    stroke={isHovered || isSelected ? '#FFFFFF' : color}
                    strokeWidth={isHovered || isSelected ? 2 : 1.5}
                    className="transition-all duration-200"
                  />

                  {/* Inner indicator dot */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={4}
                    fill={color}
                  />

                  {/* Label Text */}
                  <text
                    x={node.x}
                    y={node.y + node.r + 12}
                    textAnchor="middle"
                    fill={isHovered || isSelected ? '#FFFFFF' : '#9CA3AF'}
                    fontSize={isHovered || isSelected ? '9px' : '7.5px'}
                    fontWeight={isHovered || isSelected ? 'bold' : 'normal'}
                    className="select-none transition-all duration-200 pointer-events-none font-mono uppercase tracking-wider"
                  >
                    {node.name.length > 15 ? node.name.slice(0, 12) + '...' : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating node overlay type legends */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 max-w-[80%] pointer-events-none bg-black/60 p-1.5 rounded backdrop-blur-sm border border-white/5">
          {Object.entries(NODE_COLORS).slice(0, 8).map(([type, color]) => (
            <span key={type} className="text-[7.5px] font-mono font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
