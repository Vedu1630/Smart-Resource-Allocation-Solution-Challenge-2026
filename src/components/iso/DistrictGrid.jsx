import { useState } from 'react';

export default function DistrictGrid({ zones = [], onZoneClick, selectedZone }) {
    const [hovered, setHovered] = useState(null);

    const cells = [
        { id: 'z1', x: 80, y: 20, label: 'North' },
        { id: 'z2', x: 200, y: 20, label: 'East' },
        { id: 'z3', x: 80, y: 110, label: 'South' },
        { id: 'z4', x: 200, y: 110, label: 'West' },
    ];

    const colorMap = { critical: '#ff4757', high: '#fbbf24', moderate: '#14b8a6', low: '#3b82f6' };
    const w = 100, h = 70;
    const dx = w * 0.5, dy = w * 0.3;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
            <svg viewBox="0 0 400 280" style={{ width: '100%', maxWidth: 450, height: 'auto', display: 'block' }}>
                {/* Grid */}
                {Array.from({ length: 9 }).map((_, i) => (
                    <line key={`g${i}`} x1={i * 50} y1={0} x2={i * 50} y2={280}
                        stroke="var(--color-gray-300)" strokeWidth="0.4" opacity="0.35" />
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                    <line key={`h${i}`} x1={0} y1={i * 45} x2={400} y2={i * 45}
                        stroke="var(--color-gray-300)" strokeWidth="0.4" opacity="0.35" />
                ))}

                {cells.map((cell) => {
                    const zone = zones.find(z => z.id === cell.id);
                    const fill = zone ? colorMap[zone.urgency] || '#a1a1aa' : '#e4e4e7';
                    const isSelected = selectedZone === cell.id;
                    const isHovered = hovered === cell.id;
                    const topY = cell.y;

                    return (
                        <g key={cell.id}
                            className={`zone-block ${isSelected ? 'selected' : ''}`}
                            onClick={() => onZoneClick && onZoneClick(cell.id)}
                            onMouseEnter={() => setHovered(cell.id)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                cursor: 'pointer',
                                transform: isHovered ? 'translateY(-6px)' : isSelected ? 'translateY(-3px)' : 'none',
                                transition: 'transform 0.25s ease',
                            }}
                        >
                            {/* Top face */}
                            <polygon
                                points={`${cell.x},${topY} ${cell.x + dx},${topY - dy} ${cell.x + w},${topY} ${cell.x + dx},${topY + dy}`}
                                fill={fill} opacity={isHovered ? 0.7 : 0.5}
                                stroke={isSelected ? 'var(--color-gray-900)' : isHovered ? 'var(--color-gray-800)' : 'var(--color-gray-700)'}
                                strokeWidth={isSelected ? 1.5 : isHovered ? 1.2 : 0.8}
                                style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
                            />
                            {/* Front face */}
                            <polygon
                                points={`${cell.x},${topY} ${cell.x + dx},${topY + dy} ${cell.x + dx},${topY + dy + h} ${cell.x},${topY + h}`}
                                fill={fill} opacity={isHovered ? 0.9 : 0.75}
                                stroke={isSelected ? 'var(--color-gray-900)' : isHovered ? 'var(--color-gray-800)' : 'var(--color-gray-700)'}
                                strokeWidth={isSelected ? 1.5 : isHovered ? 1.2 : 0.8}
                                style={{ transition: 'opacity 0.2s' }}
                            />
                            {/* Right face */}
                            <polygon
                                points={`${cell.x + dx},${topY + dy} ${cell.x + w},${topY} ${cell.x + w},${topY + h} ${cell.x + dx},${topY + dy + h}`}
                                fill={fill} opacity={isHovered ? 0.55 : 0.4}
                                stroke={isSelected ? 'var(--color-gray-900)' : isHovered ? 'var(--color-gray-800)' : 'var(--color-gray-700)'}
                                strokeWidth={isSelected ? 1.5 : isHovered ? 1.2 : 0.8}
                                style={{ transition: 'opacity 0.2s' }}
                            />
                            {/* Label */}
                            <text x={cell.x + dx} y={topY + dy + h / 2 + 4}
                                textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)"
                                fill="var(--color-gray-800)" fontWeight="500"
                            >
                                {cell.label}
                            </text>

                            {/* Hover tooltip */}
                            {isHovered && zone && (
                                <g>
                                    <rect x={cell.x + dx - 50} y={topY - dy - 38} width={100} height={30} rx={4}
                                        fill="var(--color-gray-900)" />
                                    <text x={cell.x + dx} y={topY - dy - 24}
                                        textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)"
                                        fill="white" fontWeight="500">
                                        {zone.needCount} needs · {zone.volunteerCount} vols
                                    </text>
                                    <text x={cell.x + dx} y={topY - dy - 14}
                                        textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)"
                                        fill={zone.urgency === 'critical' ? '#ff9494' : zone.urgency === 'high' ? '#fde68a' : '#99f6e4'}>
                                        {zone.urgency} · {zone.coverage}% coverage
                                    </text>
                                    {/* Arrow */}
                                    <polygon
                                        points={`${cell.x + dx - 4},${topY - dy - 8} ${cell.x + dx + 4},${topY - dy - 8} ${cell.x + dx},${topY - dy - 3}`}
                                        fill="var(--color-gray-900)"
                                    />
                                </g>
                            )}

                            {/* Urgency indicator dot */}
                            {zone?.urgency === 'critical' && (
                                <circle cx={cell.x + w - 5} cy={topY + 5} r={4}
                                    fill="var(--color-coral-500)" className="pulse-critical" />
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
