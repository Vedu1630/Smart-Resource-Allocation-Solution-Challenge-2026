import { useState } from 'react';

export default function BarPrisms({ data = [] }) {
    const [hovered, setHovered] = useState(null);

    const defaults = [
        { label: 'Oct', value: 42, fill: '#14b8a6' },
        { label: 'Nov', value: 58, fill: '#3b82f6' },
        { label: 'Dec', value: 35, fill: '#14b8a6' },
        { label: 'Jan', value: 71, fill: '#a855f7' },
        { label: 'Feb', value: 63, fill: '#3b82f6' },
        { label: 'Mar', value: 82, fill: '#14b8a6' },
        { label: 'Apr', value: 55, fill: '#a855f7' },
    ];

    const bars = data.length ? data : defaults;
    const maxVal = Math.max(...bars.map(b => b.value));
    const barW = 36;
    const gap = 16;
    const dx = barW * 0.35;
    const dy = barW * 0.2;
    const maxH = 120;
    const baseY = 170;

    return (
        <svg viewBox={`0 0 ${bars.length * (barW + gap) + 60} 200`} style={{ width: '100%', maxWidth: bars.length * (barW + gap) + 60, height: 'auto' }}>
            {/* Grid */}
            {Array.from({ length: 5 }).map((_, i) => (
                <line key={`h${i}`} x1={20} y1={30 + i * 35} x2={bars.length * (barW + gap) + 40} y2={30 + i * 35}
                    stroke="var(--color-gray-300)" strokeWidth="0.4" opacity="0.35" />
            ))}

            {bars.map((bar, i) => {
                const h = (bar.value / maxVal) * maxH;
                const x = 30 + i * (barW + gap);
                const topY = baseY - h;
                const isHovered = hovered === i;

                return (
                    <g key={i}
                        className="iso-cube"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Front face with grow animation */}
                        <polygon
                            points={`${x},${baseY} ${x + barW},${baseY} ${x + barW},${topY} ${x},${topY}`}
                            fill={bar.fill} opacity={isHovered ? 0.95 : 0.8}
                            stroke="var(--color-gray-700)" strokeWidth={isHovered ? 1.2 : 0.8}
                            style={{ transition: 'opacity 0.2s' }}
                        >
                            <animate attributeName="points"
                                from={`${x},${baseY} ${x + barW},${baseY} ${x + barW},${baseY} ${x},${baseY}`}
                                to={`${x},${baseY} ${x + barW},${baseY} ${x + barW},${topY} ${x},${topY}`}
                                dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
                        </polygon>
                        {/* Top face */}
                        <polygon
                            points={`${x},${topY} ${x + dx},${topY - dy} ${x + barW + dx},${topY - dy} ${x + barW},${topY}`}
                            fill={bar.fill} opacity={isHovered ? 0.7 : 0.5}
                            stroke="var(--color-gray-700)" strokeWidth={isHovered ? 1.2 : 0.8}
                        >
                            <animate attributeName="points"
                                from={`${x},${baseY} ${x + dx},${baseY - dy} ${x + barW + dx},${baseY - dy} ${x + barW},${baseY}`}
                                to={`${x},${topY} ${x + dx},${topY - dy} ${x + barW + dx},${topY - dy} ${x + barW},${topY}`}
                                dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
                        </polygon>
                        {/* Right face */}
                        <polygon
                            points={`${x + barW},${topY} ${x + barW + dx},${topY - dy} ${x + barW + dx},${baseY - dy} ${x + barW},${baseY}`}
                            fill={bar.fill} opacity={isHovered ? 0.5 : 0.35}
                            stroke="var(--color-gray-700)" strokeWidth={isHovered ? 1.2 : 0.8}
                        >
                            <animate attributeName="points"
                                from={`${x + barW},${baseY} ${x + barW + dx},${baseY - dy} ${x + barW + dx},${baseY - dy} ${x + barW},${baseY}`}
                                to={`${x + barW},${topY} ${x + barW + dx},${topY - dy} ${x + barW + dx},${baseY - dy} ${x + barW},${baseY}`}
                                dur="0.6s" begin={`${i * 0.08}s`} fill="freeze" />
                        </polygon>

                        {/* Hover tooltip */}
                        {isHovered && (
                            <g>
                                <rect x={x + barW / 2 - 24} y={topY - 30} width={48} height={20} rx={4}
                                    fill="var(--color-gray-900)" />
                                <text x={x + barW / 2} y={topY - 17}
                                    textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)"
                                    fill="white" fontWeight="500">
                                    {Math.round(bar.value)}
                                </text>
                                <polygon
                                    points={`${x + barW / 2 - 3},${topY - 10} ${x + barW / 2 + 3},${topY - 10} ${x + barW / 2},${topY - 5}`}
                                    fill="var(--color-gray-900)" />
                            </g>
                        )}

                        {/* Value (non-hover) */}
                        {!isHovered && (
                            <text x={x + barW / 2} y={topY - 8}
                                textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)"
                                fill="var(--color-gray-600)" fontWeight="500"
                                opacity="0">
                                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${i * 0.08 + 0.5}s`} fill="freeze" />
                                {Math.round(bar.value)}
                            </text>
                        )}

                        {/* Label */}
                        <text x={x + barW / 2} y={baseY + 14}
                            textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)"
                            fill={isHovered ? 'var(--color-text-primary)' : 'var(--color-gray-400)'}
                            fontWeight={isHovered ? '500' : '400'}
                            style={{ transition: 'fill 0.2s' }}
                        >
                            {bar.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
