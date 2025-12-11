import React from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  const periods = [
    { value: '1W', label: t('chart.oneWeek') },
    { value: '2W', label: t('chart.twoWeeks') },
    { value: '1M', label: t('chart.oneMonth') },
    { value: '3M', label: t('chart.threeMonths') },
    { value: '6M', label: t('chart.sixMonths') },
    { value: '1Y', label: t('chart.oneYear') },
    { value: 'All', label: t('chart.all') },
  ];

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            px: { xs: 1, sm: 2 },
            py: 0.5,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          },
        }}
      >
        {periods.map((period) => (
          <ToggleButton key={period.value} value={period.value}>
            {period.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default TimeRangeSelector;
