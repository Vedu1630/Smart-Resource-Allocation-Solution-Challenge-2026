import { useState } from 'react';

export default function ConnectionLattice() {
    const [hoveredNode, setHoveredNode] = useState(null);
    const [hoveredEdge, setHoveredEdge] = useState(null);

    const nodes = [
        { x: 60, y: 40, r: 6, fill: '#a855f7', label: 'Medical', type: 'need' },
        { x: 140, y: 30, r: 5, fill: '#14b8a6', label: 'Yuki T.', type: 'vol' },
        { x: 220, y: 50, r: 7, fill: '#a855f7', label: 'Food Aid', type: 'need' },
        { x: 300, y: 35, r: 5, fill: '#14b8a6', label: 'Carlos R.', type: 'vol' },
        { x: 40, y: 100, r: 5, fill: '#14b8a6', label: 'Aisha P.', type: 'vol' },
        { x: 110, y: 90, r: 7, fill: '#3b82f6', label: 'Hub A', type: 'zone' },
        { x: 190, y: 110, r: 6, fill: '#a855f7', label: 'Water', type: 'need' },
        { x: 270, y: 95, r: 5, fill: '#3b82f6', label: 'Hub B', type: 'zone' },
        { x: 340, y: 105, r: 6, fill: '#14b8a6', label: 'Jin W.', type: 'vol' },
        { x: 80, y: 155, r: 6, fill: '#3b82f6', label: 'Hub C', type: 'zone' },
        { x: 160, y: 165, r: 5, fill: '#14b8a6', label: 'Fatima R.', type: 'vol' },
        { x: 240, y: 150, r: 7, fill: '#a855f7', label: 'Shelter', type: 'need' },
        { x: 320, y: 170, r: 5, fill: '#3b82f6', label: 'Hub D', type: 'zone' },
    ];

    const edges = [
        [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 6], [3, 7], [4, 5], [5, 6], [6, 7], [7, 8],
        [4, 9], [5, 10], [6, 11], [7, 12], [9, 10], [10, 11], [11, 12], [0, 5], [2, 7], [5, 10], [6, 12],
    ];

    const getConnectedNodes = (nodeIdx) => {
        const connected = new Set();
        edges.forEach(([a, b]) => {
            if (a === nodeIdx) connected.add(b);
            if (b === nodeIdx) connected.add(a);
        });
        return connected;
    };

    const connectedToHovered = hoveredNode !== null ? getConnectedNodes(hoveredNode) : new Set();

    return (
        <svg viewBox="0 0 380 200" style={{ width: '100%', maxWidth: 380, height: 'auto' }}>
            {/* Grid */}
            {Array.from({ length: 10 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={200}
                    stroke="var(--color-gray-300)" strokeWidth="0.4" opacity="0.35" />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={i * 50} x2={380} y2={i * 50}
                    stroke="var(--color-gray-300)" strokeWidth="0.4" opacity="0.35" />
            ))}

            {/* Edges */}
            {edges.map(([a, b], i) => {
                const isHighlighted = hoveredNode !== null && (a === hoveredNode || b === hoveredNode);
                return (
                    <line key={`e${i}`}
                        x1={nodes[a].x} y1={nodes[a].y}
                        x2={nodes[b].x} y2={nodes[b].y}
                        stroke={isHighlighted ? 'var(--color-purple-500)' : 'var(--color-purple-300)'}
                        strokeWidth={isHighlighted ? 1.5 : 0.8}
                        opacity={hoveredNode !== null ? (isHighlighted ? 0.8 : 0.15) : 0.5}
                        style={{ transition: 'stroke 0.2s, opacity 0.2s, stroke-width 0.2s' }}
                    />
                );
            })}

            {/* Animated data flow dots along edges */}
            {edges.slice(0, 8).map(([a, b], i) => (
                <circle key={`flow${i}`} r="2" fill="var(--color-purple-400)" opacity="0.6">
                    <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite"
                        path={`M${nodes[a].x},${nodes[a].y} L${nodes[b].x},${nodes[b].y}`} />
                </circle>
            ))}

            {/* Nodes */}
            {nodes.map((n, i) => {
                const isHovered = hoveredNode === i;
                const isConnected = connectedToHovered.has(i);
                const dimmed = hoveredNode !== null && !isHovered && !isConnected;

                return (
                    <g key={`n${i}`}
                        onMouseEnter={() => setHoveredNode(i)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Hover ring */}
                        {isHovered && (
                            <circle cx={n.x} cy={n.y} r={n.r + 6}
                                fill="none" stroke={n.fill} strokeWidth="1" opacity="0.4"
                                className="pulse-critical" />
                        )}
                        <circle cx={n.x} cy={n.y}
                            r={isHovered ? n.r + 2 : n.r}
                            fill={n.fill}
                            opacity={dimmed ? 0.25 : isHovered ? 1 : 0.7}
                            stroke={isHovered ? 'var(--color-gray-900)' : 'var(--color-gray-700)'}
                            strokeWidth={isHovered ? 1.2 : 0.8}
                            style={{ transition: 'r 0.2s, opacity 0.2s' }}
                        />
                        {/* Tooltip label */}
                        {isHovered && (
                            <g>
                                <rect x={n.x - 30} y={n.y - n.r - 22} width={60} height={16} rx={4}
                                    fill="var(--color-gray-900)" />
                                <text x={n.x} y={n.y - n.r - 11}
                                    textAnchor="middle" fontSize="7" fontFamily="var(--font-mono)"
                                    fill="white" fontWeight="500">
                                    {n.label} ({n.type})
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}
