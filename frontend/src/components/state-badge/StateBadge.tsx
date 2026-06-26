import { Tooltip } from 'antd';
import type { StateMeaning } from '../../utils/stateLabels';

interface StateBadgeProps {
  meaning: StateMeaning;
}

/** Chip de estado coloreado por familia (alumno/encargado/PC) con tooltip explicativo. */
export const StateBadge = ({ meaning }: StateBadgeProps) => (
  <Tooltip title={meaning.description} mouseEnterDelay={0.05}>
    <span style={{
      display: 'inline-block',
      padding: '1px 7px',
      borderRadius: '4px',
      backgroundColor: meaning.background,
      border: `1px solid ${meaning.border}`,
      color: meaning.color,
      fontWeight: 600,
      fontSize: '11px',
      fontFamily: 'monospace',
      lineHeight: 1.5,
      cursor: 'help',
      whiteSpace: 'nowrap',
    }}>
      {meaning.label}
    </span>
  </Tooltip>
);
