const StatusBadge = ({ status }) => {
  const normalized = status?.trim()

  const config = {
    Available: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Available'
    },
    'On Trip': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'On Trip'
    },
    'In Shop': {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      label: 'In Shop'
    },
    'Off Duty': {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      label: 'Off Duty'
    },
    Open: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Open'
    },
    Closed: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Closed'
    },
    Retired: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      label: 'Retired'
    },
    Suspended: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      label: 'Suspended'
    }
  }

  const current = config[normalized] || {
    bg: 'bg-gray-50 text-gray-700 border-gray-200',
    label: normalized || 'Unknown'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}>
      {current.label}
    </span>
  )
}

export default StatusBadge
