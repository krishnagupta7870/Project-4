import React, { useEffect, useState } from 'react';
import api from "../../utils/api";
import {
  User, Wallet, Eye, Users, Clock, ShieldAlert, CheckSquare, MessageSquare,
  ChevronRight, ArrowUpRight, ArrowDownRight, Package, Grid
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, YAxis, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

const DashboardHome = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers7d: 0,
    activeUsers30d: 0,
    sellersCount: 0,
    activeSellersCount: 0,
    newUsersThisWeek: 0,
    newSellersThisWeek: 0,
    productsCount: 0,
    totalProductViews: 0,
    totalInterestedUsers: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    reportedItemsCount: 0,
    totalSalesValue: 0,
    categoryChartData: []
  });
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, salesRes] = await Promise.all([
          api.get("/api/admin/stats"),
          api.get("/api/admin/sales-data")
        ]);
        setStats(statsRes.data);
        setSalesData(salesRes.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loader">Loading Dashboard...</div>
    </div>
  );

  const userEngagementRate = ((stats.activeUsers7d / (stats.totalUsers || 1)) * 100).toFixed(0);

  return (
    <div className="dashboard-home">

      {/* ⚠️ SHORTCUTS / ALERTS SECTION */}
      <div className="alerts-grid">
        <AlertCard
          icon={<CheckSquare className="text-emerald-500" />}
          title="Seller Verification"
          count={stats.pendingVerifications}
          label="Awaiting KYC"
          color="#10b981"
          onClick={() => onNavigate('verification')}
        />
        <AlertCard
          icon={<ShieldAlert className="text-rose-500" />}
          title="Reported Items"
          count={stats.reportedItemsCount}
          label="Action needed"
          color="#ef4444"
          onClick={() => onNavigate('reports')}
        />
      </div>

      {/* 1️⃣ USERS & SELLERS SECTION */}
      <h3 className="section-title">Users & Sellers Overview</h3>
      <div className="dashboard-grid">
        <StatCardV2
          title="Total Users"
          value={stats.totalUsers}
          trend={stats.newUsersThisWeek}
          trendLabel="new this week"
          icon={<Users size={20} />}
          color="#6366f1"
        />
        <StatCardV2
          title="Active Users"
          value={stats.activeUsers7d}
          subValue={stats.activeUsers30d}
          subLabel="30d active"
          icon={<User size={20} />}
          color="#8b5cf6"
        />
        <StatCardV2
          title="Total Sellers"
          value={stats.sellersCount}
          trend={stats.newSellersThisWeek}
          trendLabel="new this week"
          icon={<Grid size={20} />}
          color="#ec4899"
        />
        <StatCardV2
          title="Active Sellers"
          value={stats.activeSellersCount}
          subValue={stats.sellersCount - stats.activeSellersCount}
          subLabel="Inactive"
          icon={<CheckSquare size={20} />}
          color="#10b981"
        />
      </div>

      <div className="charts-grid-v2">
        <div className="chart-card">
          <div className="card-header">
            <h4 className="card-title">User Growth Trend</h4>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="val1" name="New Daily Users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUser)" />
                <Area type="monotone" dataKey="val2" name="New Listings" stroke="#ec4899" strokeWidth={2} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card engagement-card">
          <div className="card-header">
            <h4 className="card-title">User Engagement</h4>
          </div>
          <div className="donut-wrapper">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active (7d)', value: stats.activeUsers7d },
                    { name: 'Inactive', value: stats.totalUsers - stats.activeUsers7d }
                  ]}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#f3f4f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="percentage">{userEngagementRate}%</span>
              <span className="label">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2️⃣ PRODUCTS & ENGAGEMENT SECTION */}
      <h3 className="section-title">Products & Engagement</h3>
      <div className="dashboard-grid">
        <StatCardV2
          title="Total Products"
          value={stats.productsCount}
          icon={<Package size={20} />}
          color="#f59e0b"
        />
        <StatCardV2
          title="Total Views"
          value={stats.totalProductViews.toLocaleString()}
          icon={<Eye size={20} />}
          color="#3b82f6"
        />
        <StatCardV2
          title="Total Likes"
          value={stats.totalInterestedUsers.toLocaleString()}
          icon={<MessageSquare size={20} />}
          color="#10b981"
        />
        <StatCardV2
          title="Listing Revenue"
          value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
          icon={<Wallet size={20} />}
          color="#6366f1"
        />
      </div>

      <div className="charts-grid-v2">
        <div className="chart-card">
          <div className="card-header">
            <h4 className="card-title">Daily Activity</h4>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="val3" name="Activity Points" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <div className="card-header">
            <h4 className="card-title">Top Categories</h4>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={stats.categoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16}>
                  {stats.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCardV2 = ({ title, value, subValue, subLabel, trend, trendLabel, icon, color, trendUp = true }) => (
  <div className="stat-card-v2" style={{ borderTop: `4px solid ${color}` }}>
    <div className="stat-v2-header">
      <div className="stat-v2-icon" style={{ background: `${color}10`, color: color }}>
        {icon}
      </div>
      <span className="stat-v2-label">{title}</span>
    </div>
    <div className="stat-v2-body">
      <div className="stat-v2-main-row">
        <h2 className="stat-v2-main">{value}</h2>
        {trend !== undefined && (
          <div className="stat-v2-trend-badge">
            <span className="trend-val">{trend}</span>
            <span className="trend-lab">{trendLabel || 'new'}</span>
          </div>
        )}
      </div>
      {subValue !== undefined && (
        <div className="stat-v2-sub-row">
          <span className="val">{subValue}</span>
          <span className="lab">{subLabel}</span>
        </div>
      )}
    </div>
  </div>
);

const AlertCard = ({ icon, title, count, label, color, onClick }) => (
  <div className="alert-shortcut-card" onClick={onClick}>
    <div className="alert-icon-box" style={{ background: `${color}10`, color: color }}>
      {icon}
    </div>
    <div className="alert-info">
      <h4>{title}</h4>
      <div className="alert-stats">
        <span className="count" style={{ color: count > 0 ? color : '#9ca3af' }}>{count}</span>
        <span className="label">{label}</span>
      </div>
    </div>
    <ChevronRight size={18} className="chevron" />
  </div>
);

export default DashboardHome;
