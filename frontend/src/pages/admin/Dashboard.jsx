import { useEffect, useState } from 'react';
import {
  Alert, Button, Card, CardContent, CircularProgress, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography,
} from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import api from '../../api/axios';

const currentYear = new Date().getFullYear();

export default function Dashboard() {
  const [year, setYear] = useState(currentYear);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const [chartType, setChartType] = useState('line');
  const [sales, setSales] = useState({ months: [], totalSales: 0, orderCount: 0 });
  const [counts, setCounts] = useState({ products: 0, users: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { year };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const [salesResponse, productsResponse, usersResponse] = await Promise.all([
        api.get('/admin/sales', { params }),
        api.get('/admin/products'),
        api.get('/admin/users'),
      ]);
      setSales(salesResponse.data);
      setCounts({
        products: productsResponse.data.products?.length || 0,
        users: usersResponse.data.users?.length || 0,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [year, startDate, endDate]);

  const applyRange = () => {
    if (draftStart && draftEnd && draftStart > draftEnd) {
      setError('Start date must be before or equal to the end date.');
      return;
    }
    setStartDate(draftStart);
    setEndDate(draftEnd);
  };

  const resetRange = () => {
    setDraftStart('');
    setDraftEnd('');
    setStartDate('');
    setEndDate('');
  };

  const chart = chartType === 'line' ? (
    <LineChart data={sales.months}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip formatter={(value, name) => name === 'sales' ? [`$${Number(value).toFixed(2)}`, 'Sales'] : [value, 'Orders']} />
      <Legend />
      <Line dataKey="sales" name="Sales" stroke="#263a32" strokeWidth={3} />
      <Line dataKey="orders" name="Orders" stroke="#b48a43" />
    </LineChart>
  ) : (
    <BarChart data={sales.months}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip formatter={(value, name) => name === 'sales' ? [`$${Number(value).toFixed(2)}`, 'Sales'] : [value, 'Orders']} />
      <Legend />
      <Bar dataKey="sales" name="Sales" fill="#263a32" />
      <Bar dataKey="orders" name="Orders" fill="#b48a43" />
    </BarChart>
  );

  return (
    <Stack spacing={3}>
      <Typography variant="h2">Sales dashboard</Typography>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={2}>
        {[
          ['Total sales', `$${Number(sales.totalSales || 0).toFixed(2)}`],
          ['Completed orders', sales.orderCount || 0],
          ['Products', counts.products],
          ['Users', counts.users],
        ].map(([label, value]) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4">{value}</Typography></CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Stack alignItems={{ xs: 'stretch', md: 'center' }} direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="sales-year">Year</InputLabel>
          <Select labelId="sales-year" label="Year" value={year} onChange={(event) => setYear(event.target.value)}>
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="Start date" type="date" value={draftStart} onChange={(event) => setDraftStart(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" label="End date" type="date" value={draftEnd} onChange={(event) => setDraftEnd(event.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" onClick={applyRange}>Apply</Button>
        <Button variant="outlined" onClick={resetRange}>Reset</Button>
        <FormControlLabel control={<Switch checked={chartType === 'bar'} onChange={(event) => setChartType(event.target.checked ? 'bar' : 'line')} />} label="Bar chart" />
      </Stack>
      <Card sx={{ p: 2, minWidth: 0 }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: 420 }}>
            <CircularProgress aria-label="Loading dashboard" />
          </Stack>
        ) : sales.months.length ? (
          <ResponsiveContainer width="100%" height={420}>{chart}</ResponsiveContainer>
        ) : (
          <Typography color="text.secondary" sx={{ py: 18, textAlign: 'center' }}>No completed sales for this period.</Typography>
        )}
      </Card>
    </Stack>
  );
}
