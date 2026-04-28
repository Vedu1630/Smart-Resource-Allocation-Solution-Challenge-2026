import { useState } from 'react';

export default function DashboardCubes() {
    const [hovered, setHovered] = useState(null);

    // Clean 3×3 grid layout — no overlaps, uniform spacing
    const cubes = [
        { col: 0, row: 0, h: 40, fill: '#ff4757', label: 'Critical', severity: 9 },
        { col: 1, row: 0, h: 55, fill: '#ff6b6b', label: 'Medical', severity: 8 },
        { col: 2, row: 0, h: 30, fill: '#fbbf24', label: 'Infra', severity: 7 },
        { col: 0, row: 1, h: 45, fill: '#fbbf24', label: 'Water', severity: 8 },
        { col: 1, row: 1, h: 25, fill: '#14b8a6', label: 'Done', severity: 3 },
        { col: 2, row: 1, h: 50, fill: '#ff9494', label: 'Food', severity: 6 },
        { col: 0, row: 2, h: 20, fill: '#14b8a6', label: 'IT', severity: 4 },
        { col: 1, row: 2, h: 35, fill: '#ff4757', label: 'Shelter', severity: 9 },
        { col: 2, row: 2, h: 28, fill: '#a1a1aa', label: 'Other', severity: 2 },
    ];

    const cellW = 44;
    const cellD = 22; // isometric depth
    const gapX = 52;
    const gapY = 42;
    const originX = 80;
    const originY = 40;

    return (
        <svg viewBox="0 0 300 220" style={{ width: '100%', maxWidth: 280, height: 'auto' }}>
            {/* Isometric grid lines */}
            {[0, 1, 2, 3].map(i => (
                <g key={`grid-${i}`}>
                    <line
                        x1={originX + i * gapX * 0.5} y1={originY + i * gapY * 0.5}
                        x2={originX + i * gapX * 0.5 + 180} y2={originY + i * gapY * 0.5 + 60}
                        stroke="var(--color-gray-300)" strokeWidth="0.4" opacity="0.3"
                    />
                    <line
                        x1={originX + i * gapX * 0.6 + 20} y1={originY + 120 - i * gapY * 0.4}
                        x2={originX + i * gapX * 0.6 + 20 - 60} y2={originY + 120 - i * gapY * 0.4 - 40}
                        stroke="var(--color-gray-300)" strokeWidth="0.4" opacity="0.3"
                    />
                </g>
            ))}

            {cubes.map((c, i) => {
                // Isometric position: convert col/row to screen x/y
                const isoX = originX + c.col * gapX - c.row * 10;
                const isoY = originY + c.row * gapY + c.col * 14;
                const w = cellW;
                const dx = w * 0.5;
                const dy = w * 0.28;
                const topY = isoY;
                const isHovered = hovered === i;

                return (
                    <g key={i}
                        className="iso-cube"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            transform: isHovered ? 'translateY(-5px)' : 'none',
                            transition: 'transform 0.25s ease',
                        }}
                    >
                        {/* Top face */}
                        <polygon
                            points={`${isoX},${topY - c.h} ${isoX + dx},${topY - c.h - dy} ${isoX + w},${topY - c.h} ${isoX + dx},${topY - c.h + dy}`}
                            fill={c.fill}
                            opacity={isHovered ? 0.75 : 0.55}
                            stroke="var(--color-gray-600)" strokeWidth={isHovered ? 1 : 0.7}
                            style={{ transition: 'opacity 0.2s' }}
                        />
                        {/* Front face */}
                        <polygon
                            points={`${isoX},${topY - c.h} ${isoX + dx},${topY - c.h + dy} ${isoX + dx},${topY + dy} ${isoX},${topY}`}
                            fill={c.fill}
                            opacity={isHovered ? 0.95 : 0.8}
                            stroke="var(--color-gray-600)" strokeWidth={isHovered ? 1 : 0.7}
                            style={{ transition: 'opacity 0.2s' }}
                        />
                        {/* Right face */}
                        <polygon
                            points={`${isoX + dx},${topY - c.h + dy} ${isoX + w},${topY - c.h} ${isoX + w},${topY} ${isoX + dx},${topY + dy}`}
                            fill={c.fill}
                            opacity={isHovered ? 0.55 : 0.4}
                            stroke="var(--color-gray-600)" strokeWidth={isHovered ? 1 : 0.7}
                            style={{ transition: 'opacity 0.2s' }}
                        />

                        {/* Severity text on front face */}
                        <text x={isoX + dx * 0.5} y={topY - c.h / 2 + dy * 0.3}
                            textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)"
                            fontWeight="500" fill="white" opacity={isHovered ? 1 : 0.8}>
                            {c.severity}
                        </text>

                        {/* Hover label tooltip */}
                        {isHovered && (
                            <g>
                                <rect x={isoX + dx - 30} y={topY - c.h - dy - 24} width={60} height={18} rx={4}
                                    fill="var(--color-gray-900)" />
                                <text x={isoX + dx} y={topY - c.h - dy - 12}
                                    textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)"
                                    fill="white" fontWeight="500">
                                    {c.label} · {c.severity}/10
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}
