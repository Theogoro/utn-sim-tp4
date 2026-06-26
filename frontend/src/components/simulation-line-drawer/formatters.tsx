const formatMinutes = (seconds: number | null) => {
  if (seconds === null) return '-';
  return `${(seconds / 60).toFixed(2)} min`;
};

const formatClock = (seconds: number | null) => {
  if (seconds === null) return '-';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatRnd = (value: number | null) => {
  if (value === null) return '-';
  return value.toFixed(4);
};

export {
    formatClock,
    formatMinutes,
    formatRnd
}