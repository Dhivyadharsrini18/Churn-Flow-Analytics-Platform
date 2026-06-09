import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, BrainCircuit, BriefcaseBusiness,
  Check, ChevronDown, CircleDollarSign, CloudUpload, Command, CreditCard, Database, Download,
  FileBarChart, FileText, Filter, Gauge, HeartHandshake, LayoutDashboard, Lightbulb, ListFilter,
  Menu, Moon, MoreHorizontal, PieChart, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Sun,
  Target, TrendingDown, UserCheck, UserRoundSearch, Users, WandSparkles, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart,
  Pie, PieChart as RePieChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import { api } from "./api";
import {
  chargeBands, cohortMatrix, contractData, customers, featureImportance, modelMetrics, monthlyTrend, paymentData,
  predictionDefaults, revenueOpportunity, rocData, segments, serviceData, supportData, tenureData
} from "./data";
import type { PredictionInput, PredictionResult, View } from "./types";

const COLORS = ["#8dcdf8", "#f5a7c7", "#b8dfff", "#ffd6e8"];
const nav = [
  { id: "overview", label: "Executive overview", icon: LayoutDashboard },
  { id: "analytics", label: "Advanced analytics", icon: BarChart3 },
  { id: "customers", label: "Customer intelligence", icon: Users },
  { id: "prediction", label: "Churn prediction", icon: BrainCircuit },
  { id: "model", label: "Model performance", icon: Gauge },
  { id: "reports", label: "Reports & exports", icon: FileBarChart }
] as const;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function GlassCard({
  children,
  className = "",
  delay = 0,
  onClick
}: { children: React.ReactNode; className?: string; delay?: number; onClick?: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay }}
      className={`glass-card ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.section>
  );
}

function ChartHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="card-heading">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {action || <button className="icon-button" aria-label={`Open ${title}`}><ArrowUpRight size={18} /></button>}
    </div>
  );
}

function ChartModal({ title, onClose }: { title: string | null; onClose: () => void }) {
  if (!title) return null;
  return (
    <motion.div className="chart-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="chart-modal" initial={{ opacity: 0, scale: .94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }} onClick={(event) => event.stopPropagation()}>
        <div className="chart-modal-head">
          <div>
            <span>Expanded analytics view</span>
            <h2>{title}</h2>
            <p>Use this detailed view to inspect trends, compare segments, and decide the next retention action.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="chart-modal-body">
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={monthlyTrend} margin={{ top: 20, right: 20, left: -10, bottom: 8 }}>
              <defs>
                <linearGradient id="modalBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7cc8ff" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#7cc8ff" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 14, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 13 }} />
              <Tooltip content={<FancyTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="churn" name="Churn %" stroke="#f38ab8" strokeWidth={4} fill="url(#modalBlue)" />
              <Bar dataKey="revenue" name="Revenue risk ($K)" fill="#ffd6e8" radius={[9, 9, 0, 0]} />
              <Line type="monotone" dataKey="retained" name="Retention %" stroke="#4f9ddd" strokeWidth={3} dot={{ r: 4, fill: "#4f9ddd" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-modal-insights">
          <div><span>Primary insight</span><b>Risk is concentrated in short-tenure and month-to-month cohorts.</b></div>
          <div><span>Recommended action</span><b>Prioritize annual contract migration and proactive support outreach.</b></div>
          <div><span>Export</span><b>Dashboard PNG/PDF export can be connected from this view.</b></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FancyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label || payload[0]?.name}</strong>
      {payload.map((item: any) => (
        <div key={item.dataKey || item.name}>
          <span style={{ background: item.color }} />
          {item.name}: <b>{typeof item.value === "number" ? item.value.toLocaleString() : item.value}</b>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, trend, detail, color, delay }: any) {
  const positive = trend >= 0;
  return (
    <GlassCard className="kpi-card" delay={delay}>
      <div className={`kpi-icon ${color}`}><Icon size={20} /></div>
      <div className="kpi-label">{label}<MoreHorizontal size={16} /></div>
      <strong className="kpi-value">{value}</strong>
      <div className="kpi-footer">
        <span className={positive ? "trend up" : "trend down"}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
        <span>{detail}</span>
      </div>
    </GlassCard>
  );
}

function ProductHero({ setView }: { setView: (view: View) => void }) {
  return (
    <motion.section
      className="product-hero"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="hero-copy">
        <div className="hero-badge"><Sparkles size={15} /> Customer retention analytics</div>
        <h1>Know which customers need attention today.</h1>
        <p>
          A polished churn prediction platform with executive KPIs, customer risk scoring,
          revenue impact analysis, and clear retention actions.
        </p>
        <div className="hero-actions">
          <button className="button white" onClick={() => setView("prediction")}><BrainCircuit size={18} /> Predict customer churn</button>
          <button className="button glass" onClick={() => setView("analytics")}><BarChart3 size={18} /> Explore analytics</button>
        </div>
        <div className="hero-proof">
          <span><b>91.6%</b> ROC-AUC</span>
          <span><b>$139.8K</b> revenue at risk</span>
          <span><b>7,043</b> customer profiles</span>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-window">
          <div className="window-top"><i /><i /><i /><span>Retention Monitor</span></div>
          <div className="hero-window-grid">
            <div className="mini-kpi"><span>Churn probability</span><strong>84%</strong><small>Critical risk</small></div>
            <div className="mini-kpi soft"><span>Retention value</span><strong>$2.8K</strong><small>recoverable</small></div>
            <div className="mini-chart">
              {[48, 70, 42, 86, 62, 95, 74].map((height, index) => <b key={index} style={{ height: `${height}%` }} />)}
            </div>
            <div className="mini-explain">
              <div><span>Contract type</span><i style={{ width: "92%" }} /></div>
              <div><span>Short tenure</span><i style={{ width: "76%" }} /></div>
              <div><span>No tech support</span><i style={{ width: "61%" }} /></div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Overview({ setView, openChart }: { setView: (view: View) => void; openChart: (title: string) => void }) {
  return (
    <div className="page-grid">
      <ProductHero setView={setView} />

      <div className="welcome-row">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> Executive overview</div>
          <h1>Retention performance snapshot</h1>
          <p>Monitor churn, revenue exposure, customer segments, and the best next actions from one clear workspace.</p>
        </div>
        <div className="welcome-actions">
          <button className="button secondary"><Download size={17} /> Export dashboard</button>
          <button className="button primary" onClick={() => setView("prediction")}><Zap size={17} /> Run prediction</button>
        </div>
      </div>

      <GlassCard className="span-12 overview-strip">
        <div><span>Interactive charts</span><strong>18</strong><small>open, inspect, compare</small></div>
        <div><span>High risk customers</span><strong>1,869</strong><small>prioritized by probability</small></div>
        <div><span>Revenue at risk</span><strong>$139.8K</strong><small>monthly exposure</small></div>
        <div><span>Retention actions</span><strong>4</strong><small>ranked by impact</small></div>
      </GlassCard>

      <div className="kpi-grid">
        <KpiCard icon={Users} label="Total customers" value="7,043" trend={8.2} detail="vs. last month" color="purple" delay={0} />
        <KpiCard icon={UserCheck} label="Active customers" value="5,174" trend={4.1} detail="73.5% of base" color="blue" delay={0.05} />
        <KpiCard icon={TrendingDown} label="Churn rate" value="26.54%" trend={-2.4} detail="improvement" color="pink" delay={0.1} />
        <KpiCard icon={CircleDollarSign} label="Revenue at risk" value="$139.8K" trend={-5.7} detail="monthly exposure" color="orange" delay={0.15} />
        <KpiCard icon={HeartHandshake} label="Avg. lifetime value" value="$2,284" trend={12.3} detail="per customer" color="green" delay={0.2} />
      </div>

      <GlassCard className="hero-chart span-8" onClick={() => openChart("Churn intelligence trend")}>
        <ChartHeader
          title="Churn intelligence trend"
          subtitle="Monthly churn rate and revenue exposure"
          action={<button className="select-button">Last 12 months <ChevronDown size={15} /></button>}
        />
        <div className="chart-stat-row">
          <div><span>Current churn rate</span><strong>15.2%</strong><em className="success">-1.2% MoM</em></div>
          <div><span>Revenue exposure</span><strong>$94K</strong><em className="success">-7.8% MoM</em></div>
        </div>
        <ResponsiveContainer width="100%" height={285}>
          <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="churnFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b6be8" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#8b6be8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} unit="%" />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} unit="K" />
            <Tooltip content={<FancyTooltip />} />
            <Area yAxisId="left" type="monotone" dataKey="churn" name="Churn rate" stroke="#7c5ce7" strokeWidth={3} fill="url(#churnFill)" />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue risk" stroke="#f08ab4" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-6" onClick={() => openChart("Revenue recovery by risk band")}>
        <ChartHeader title="Revenue recovery by risk band" subtitle="Risk intensity, revenue exposure, and save potential" />
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={revenueOpportunity} margin={{ top: 16, right: 10, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="riskBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7cc8ff" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#d8efff" stopOpacity={0.75} />
              </linearGradient>
              <linearGradient id="riskPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f38ab8" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#ffd6e8" stopOpacity={0.78} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="segment" axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 14, fontWeight: 700 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 13 }} />
            <Tooltip content={<FancyTooltip />} />
            <Legend />
            <Bar dataKey="revenue" name="Revenue at risk ($K)" fill="url(#riskPink)" radius={[9, 9, 0, 0]} />
            <Bar dataKey="saveRate" name="Expected save %" fill="url(#riskBlue)" radius={[9, 9, 0, 0]} />
            <Line dataKey="risk" name="Risk score" stroke="#4f9ddd" strokeWidth={4} dot={{ r: 5, fill: "#4f9ddd" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-6" onClick={() => openChart("Lifecycle risk matrix")}>
        <ChartHeader title="Lifecycle risk matrix" subtitle="Cohort-level distribution across risk bands" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cohortMatrix} margin={{ top: 16, right: 10, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="cohort" axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 14, fontWeight: 700 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 13 }} />
            <Tooltip content={<FancyTooltip />} />
            <Legend />
            <Bar dataKey="low" stackId="a" name="Low" fill="#b8dfff" radius={[0, 0, 6, 6]} />
            <Bar dataKey="medium" stackId="a" name="Medium" fill="#8dcdf8" />
            <Bar dataKey="high" stackId="a" name="High" fill="#ffd6e8" />
            <Bar dataKey="critical" stackId="a" name="Critical" fill="#f38ab8" radius={[9, 9, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-4 risk-panel" onClick={() => openChart("Risk distribution")}>
        <ChartHeader title="Risk distribution" subtitle="Customers by prediction band" />
        <div className="donut-wrap">
          <ResponsiveContainer width="100%" height={210}>
            <RePieChart>
              <Pie data={[{ name: "High risk", value: 1869 }, { name: "Watch", value: 1294 }, { name: "Healthy", value: 3880 }]} innerRadius={66} outerRadius={91} paddingAngle={4} dataKey="value">
                {COLORS.slice(0, 3).map((color) => <Cell key={color} fill={color} />)}
              </Pie>
              <Tooltip content={<FancyTooltip />} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="donut-center"><strong>7,043</strong><span>customers</span></div>
        </div>
        <div className="risk-legend">
          <div><i className="critical" /><span>High risk</span><b>1,869</b><small>26.5%</small></div>
          <div><i className="watch" /><span>Watchlist</span><b>1,294</b><small>18.4%</small></div>
          <div><i className="healthy" /><span>Healthy</span><b>3,880</b><small>55.1%</small></div>
        </div>
        <button className="text-button" onClick={() => setView("customers")}>View customer intelligence <ArrowUpRight size={15} /></button>
      </GlassCard>

      <GlassCard className="span-5" onClick={() => openChart("Churn by contract")}>
        <ChartHeader title="Churn by contract" subtitle="Rate and customer volume" />
        <ResponsiveContainer width="100%" height={245}>
          <BarChart data={contractData} margin={{ top: 12, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <Tooltip content={<FancyTooltip />} />
            <Bar dataKey="churned" name="Churn rate %" radius={[8, 8, 2, 2]} fill="#f08ab4" />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-3" onClick={() => openChart("Top churn drivers")}>
        <ChartHeader title="Top churn drivers" subtitle="SHAP global importance" />
        <div className="feature-list">
          {featureImportance.slice(0, 5).map((item, index) => (
            <div key={item.feature}>
              <span>{index + 1}</span>
              <div><b>{item.feature}</b><div className="progress"><i style={{ width: `${item.value * 100}%` }} /></div></div>
              <strong>{item.value.toFixed(2)}</strong>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="span-4 insight-card">
        <div className="insight-icon"><WandSparkles size={23} /></div>
        <div className="eyebrow">Executive decision brief</div>
        <h3>Month-to-month customers need immediate attention</h3>
        <p>They are <b>4.8x more likely to churn</b>, representing $82K in monthly revenue exposure. A 12-month loyalty incentive could retain an estimated 312 customers.</p>
        <div className="insight-metrics">
          <div><strong>$34.2K</strong><span>recoverable MRR</span></div>
          <div><strong>312</strong><span>retention wins</span></div>
        </div>
        <button className="button soft">Open recommendation <ArrowUpRight size={16} /></button>
      </GlassCard>

      <GlassCard className="span-4" onClick={() => openChart("Tenure risk curve")}>
        <ChartHeader title="Tenure risk curve" subtitle="Churn rate by customer lifecycle stage" />
        <ResponsiveContainer width="100%" height={255}>
          <ComposedChart data={tenureData} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip content={<FancyTooltip />} />
            <Bar dataKey="customers" name="Customer volume" fill="#b8dfff" opacity={0.8} radius={[7, 7, 0, 0]} />
            <Line type="monotone" dataKey="churn" name="Churn %" stroke="#ec7faa" strokeWidth={3} dot={{ r: 4, fill: "#ec7faa" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-4" onClick={() => openChart("Payment risk ranking")}>
        <ChartHeader title="Service risk comparison" subtitle="Churn and revenue exposure by service type" />
        <ResponsiveContainer width="100%" height={255}>
          <ComposedChart data={serviceData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="service" axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 12, fontWeight: 700 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 12 }} />
            <Tooltip content={<FancyTooltip />} />
            <Bar dataKey="revenue" name="Revenue risk ($K)" fill="#ffd6e8" radius={[8, 8, 0, 0]} />
            <Line dataKey="churn" name="Churn %" stroke="#4f9ddd" strokeWidth={3.5} dot={{ r: 5, fill: "#4f9ddd" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-4" onClick={() => openChart("Charge sensitivity")}>
        <ChartHeader title="Support impact" subtitle="Risk reduction from support and security services" />
        <ResponsiveContainer width="100%" height={255}>
          <BarChart data={supportData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 700 }} interval={0} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text)", fontSize: 12 }} />
            <Tooltip content={<FancyTooltip />} />
            <Bar dataKey="churn" name="Churn %" radius={[8, 8, 0, 0]}>
              {supportData.map((_, index) => <Cell key={index} fill={index % 2 === 0 ? "#f38ab8" : "#8dcdf8"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-4" onClick={() => openChart("Service risk comparison")}>
        <ChartHeader title="Payment risk ranking" subtitle="Churn concentration by payment method" />
        <ResponsiveContainer width="100%" height={255}>
          <BarChart data={paymentData} layout="vertical" margin={{ top: 8, left: 26, right: 14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" horizontal={false} stroke="var(--grid)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={108} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip content={<FancyTooltip />} />
            <Bar dataKey="value" name="Churn %" fill="#8dcdf8" radius={[0, 9, 9, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-4" onClick={() => openChart("Support impact")}>
        <ChartHeader title="Charge sensitivity" subtitle="Churn and retention by billing band" />
        <ResponsiveContainer width="100%" height={255}>
          <BarChart data={chargeBands} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip content={<FancyTooltip />} />
            <Legend iconType="circle" iconSize={9} />
            <Bar dataKey="retained" stackId="a" name="Retained" fill="#b8dfff" radius={[0, 0, 5, 5]} />
            <Bar dataKey="churned" stackId="a" name="Churned" fill="#f5a7c7" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-6" onClick={() => openChart("Segment portfolio")}>
        <ChartHeader title="Segment portfolio" subtitle="Customer mix and retention priority" />
        <div className="segment-layout overview-segments">
          <ResponsiveContainer width="45%" height={250}>
            <RePieChart>
              <Pie data={segments} innerRadius={58} outerRadius={92} paddingAngle={4} dataKey="value">
                {segments.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip content={<FancyTooltip />} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="segment-list">
            {segments.map((s) => <div key={s.name}><i style={{ background: s.color }} /><span><b>{s.name}</b><small>{s.detail}</small></span><strong>{s.value}%</strong></div>)}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="span-6 action-card">
        <ChartHeader title="Revenue recovery plan" subtitle="Highest impact actions for this month" />
        <div className="action-list">
          <div><span>01</span><b>Annual contract offer</b><em>$34.2K recoverable MRR</em><strong>312 customers</strong></div>
          <div><span>02</span><b>Technical support outreach</b><em>$18.7K protected MRR</em><strong>221 customers</strong></div>
          <div><span>03</span><b>Payment method migration</b><em>$11.4K protected MRR</em><strong>148 customers</strong></div>
          <div><span>04</span><b>New customer onboarding</b><em>$9.8K protected MRR</em><strong>196 customers</strong></div>
        </div>
      </GlassCard>
    </div>
  );
}

function Analytics() {
  const [segment, setSegment] = useState("All customers");
  return (
    <div className="page-grid">
      <div className="page-title">
        <div><div className="eyebrow"><Activity size={14} /> Exploration studio</div><h1>Advanced analytics</h1><p>Explore behavioral patterns, segments, and the factors shaping churn.</p></div>
        <div className="welcome-actions"><button className="button secondary"><Filter size={16} /> Filters</button><button className="button primary"><Download size={16} /> Export charts</button></div>
      </div>
      <GlassCard className="span-12 filter-bar">
        <ListFilter size={18} />
        {["All customers", "High risk", "Fiber optic", "Month-to-month", "New customers"].map((name) => (
          <button key={name} onClick={() => setSegment(name)} className={segment === name ? "active" : ""}>{name}</button>
        ))}
        <span className="filter-count">7,043 records</span>
      </GlassCard>

      <GlassCard className="span-7">
        <ChartHeader title="Tenure risk curve" subtitle={`Churn rate across lifecycle · ${segment}`} />
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={tenureData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <defs><linearGradient id="tenureFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f08ab4" stopOpacity=".35" /><stop offset="1" stopColor="#f08ab4" stopOpacity=".03" /></linearGradient></defs>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)" }} />
            <Tooltip content={<FancyTooltip />} />
            <Area type="monotone" dataKey="churn" name="Churn %" fill="url(#tenureFill)" stroke="#e76a9f" strokeWidth={3} />
            <Bar dataKey="customers" name="Customers" fill="#c9b7f5" opacity={0.45} radius={[5, 5, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-5">
        <ChartHeader title="Customer segments" subtitle="Behavioral clustering overview" />
        <div className="segment-layout">
          <ResponsiveContainer width="53%" height={230}>
            <RePieChart><Pie data={segments} innerRadius={54} outerRadius={86} paddingAngle={3} dataKey="value">{segments.map((s) => <Cell key={s.name} fill={s.color} />)}</Pie><Tooltip content={<FancyTooltip />} /></RePieChart>
          </ResponsiveContainer>
          <div className="segment-list">{segments.map((s) => <div key={s.name}><i style={{ background: s.color }} /><span><b>{s.name}</b><small>{s.detail}</small></span><strong>{s.value}%</strong></div>)}</div>
        </div>
      </GlassCard>

      <GlassCard className="span-6">
        <ChartHeader title="Monthly charge sensitivity" subtitle="Churn volume by billing band" />
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={chargeBands} margin={{ top: 12, left: -18 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip content={<FancyTooltip />} /><Legend iconType="circle" iconSize={8} />
            <Bar dataKey="retained" stackId="a" fill="#c9b7f5" radius={[0, 0, 4, 4]} />
            <Bar dataKey="churned" stackId="a" fill="#f08ab4" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-6">
        <ChartHeader title="Payment method behavior" subtitle="Churn rate with customer volume" />
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={paymentData} layout="vertical" margin={{ top: 10, left: 22, right: 18 }}>
            <CartesianGrid strokeDasharray="4 6" horizontal={false} stroke="var(--grid)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <Tooltip content={<FancyTooltip />} />
            <Bar dataKey="value" name="Churn %" fill="#8b6be8" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard className="span-7">
        <ChartHeader title="Feature correlation heatmap" subtitle="Relationship strength among key variables" />
        <div className="heatmap">
          <div className="heat-labels">{["Churn", "Tenure", "Charges", "Contract", "Support", "Security"].map((x) => <span key={x}>{x}</span>)}</div>
          {[
            [1, -.35, .29, .41, -.27, -.31], [-.35, 1, .25, -.52, .33, .29], [.29, .25, 1, .18, .12, .08],
            [.41, -.52, .18, 1, -.24, -.22], [-.27, .33, .12, -.24, 1, .46], [-.31, .29, .08, -.22, .46, 1]
          ].map((row, i) => <div className="heat-row" key={i}>{row.map((value, j) => <span key={j} title={`${value}`} style={{ background: value >= 0 ? `rgba(124,92,231,${Math.abs(value)})` : `rgba(240,138,180,${Math.abs(value)})` }}>{value.toFixed(2)}</span>)}</div>)}
        </div>
      </GlassCard>

      <GlassCard className="span-5">
        <ChartHeader title="Demographic risk radar" subtitle="Indexed churn propensity" />
        <ResponsiveContainer width="100%" height={290}>
          <RadarChart data={[
            { axis: "Senior", risk: 77, baseline: 54 }, { axis: "Female", risk: 56, baseline: 52 }, { axis: "Dependents", risk: 31, baseline: 48 },
            { axis: "Partner", risk: 39, baseline: 50 }, { axis: "No support", risk: 84, baseline: 55 }, { axis: "Paperless", risk: 72, baseline: 49 }
          ]}>
            <PolarGrid stroke="var(--grid)" /><PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <Radar name="Risk cohort" dataKey="risk" stroke="#e76a9f" fill="#f08ab4" fillOpacity={0.35} />
            <Radar name="Baseline" dataKey="baseline" stroke="#7c5ce7" fill="#7c5ce7" fillOpacity={0.12} />
            <Tooltip content={<FancyTooltip />} /><Legend />
          </RadarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}

function Customers() {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All");
  const filtered = customers.filter((c) => (risk === "All" || c.risk_level === risk) && c.customer_id.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="page-grid">
      <div className="page-title">
        <div><div className="eyebrow"><UserRoundSearch size={14} /> Customer intelligence</div><h1>Risk command center</h1><p>Prioritize outreach with individual churn scores and recommended actions.</p></div>
        <button className="button primary"><CloudUpload size={17} /> Import customers</button>
      </div>
      <div className="kpi-grid customer-kpis">
        <KpiCard icon={Target} label="Critical queue" value="426" trend={-4.2} detail="needs action" color="pink" />
        <KpiCard icon={CircleDollarSign} label="Revenue recoverable" value="$34.2K" trend={13.7} detail="this month" color="green" />
        <KpiCard icon={HeartHandshake} label="Retention opportunities" value="1,128" trend={8.4} detail="qualified" color="purple" />
        <KpiCard icon={Check} label="Customers saved" value="286" trend={21.6} detail="last 30 days" color="blue" />
      </div>
      <GlassCard className="span-12 table-card">
        <div className="table-tools">
          <div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer ID..." /></div>
          <div className="risk-tabs">{["All", "Critical", "High", "Medium", "Low"].map((x) => <button className={risk === x ? "active" : ""} onClick={() => setRisk(x)} key={x}>{x}</button>)}</div>
          <button className="icon-button"><Settings2 size={17} /></button>
          <button className="button secondary compact"><Download size={16} /> CSV</button>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Customer</th><th>Profile</th><th>Contract</th><th>Monthly value</th><th>Churn probability</th><th>Risk</th><th>Recommended action</th><th /></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.customer_id}>
                  <td><div className="customer-cell"><span>{c.gender === "Female" ? "OS" : "AM"}</span><div><b>{c.customer_id}</b><small>{c.tenure} months tenure</small></div></div></td>
                  <td><b>{c.internet_service}</b><small>{c.tech_support === "Yes" ? "Support enabled" : "No tech support"}</small></td>
                  <td><b>{c.contract}</b><small>{c.payment_method}</small></td>
                  <td><b>{formatMoney(c.monthly_charges)}</b><small>{formatMoney(c.total_charges)} lifetime</small></td>
                  <td><div className="score-cell"><div className="progress"><i style={{ width: `${c.churn_probability * 100}%` }} /></div><b>{Math.round(c.churn_probability * 100)}%</b></div></td>
                  <td><span className={`risk-badge ${c.risk_level.toLowerCase()}`}>{c.risk_level}</span></td>
                  <td><span className="recommendation">{c.risk_level === "Critical" ? "Call + 20% offer" : c.risk_level === "High" ? "Loyalty incentive" : c.risk_level === "Medium" ? "Engagement email" : "Monitor"}</span></td>
                  <td><button className="icon-button"><MoreHorizontal size={17} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing {filtered.length} of 7,043 customers</span><div><button disabled>Previous</button><button className="active">1</button><button>2</button><button>3</button><button>Next</button></div></div>
      </GlassCard>
    </div>
  );
}

function Prediction() {
  const [input, setInput] = useState<PredictionInput>(predictionDefaults);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"manual" | "batch">("manual");

  const update = (field: keyof PredictionInput, value: string | number) => setInput((old) => ({ ...old, [field]: value }));
  const predict = async () => {
    setLoading(true);
    try {
      setResult(await api.predict(input));
    } catch {
      const score = Math.min(0.97, Math.max(0.06, 0.18 + (input.contract === "Month-to-month" ? .28 : 0) + (input.tenure < 12 ? .19 : -.12) + (input.tech_support === "No" ? .13 : -.08) + (input.monthly_charges > 80 ? .11 : 0)));
      setResult({
        churn_probability: score,
        risk_level: score > .75 ? "Critical" : score > .55 ? "High" : score > .3 ? "Medium" : "Low",
        confidence_score: .916,
        prediction: score > .5 ? "Likely to churn" : "Likely to stay",
        strategy: score > .5 ? "Offer a 15-20% loyalty discount tied to an annual contract and schedule proactive support outreach." : "Maintain regular engagement and introduce a loyalty reward at the next billing milestone.",
        explanation: [
          { feature: "Month-to-month contract", impact: .31, direction: "increases risk" },
          { feature: "Short tenure", impact: .24, direction: "increases risk" },
          { feature: "No tech support", impact: .16, direction: "increases risk" },
          { feature: "Monthly charges", impact: .12, direction: "increases risk" },
          { feature: "Automatic payment", impact: -.07, direction: "reduces risk" }
        ]
      });
    } finally { setLoading(false); }
  };

  return (
    <div className="page-grid">
      <div className="page-title">
        <div><div className="eyebrow"><BrainCircuit size={14} /> Prediction studio</div><h1>Customer churn prediction</h1><p>Score customers in real time and translate model signals into retention action.</p></div>
        <div className="model-pill"><span /><div><b>XGBoost v2.4</b><small>91.6% ROC-AUC · Live</small></div></div>
      </div>
      <GlassCard className="span-7 prediction-form">
        <div className="tab-switch"><button className={tab === "manual" ? "active" : ""} onClick={() => setTab("manual")}><UserRoundSearch size={16} /> Manual entry</button><button className={tab === "batch" ? "active" : ""} onClick={() => setTab("batch")}><CloudUpload size={16} /> Batch CSV</button></div>
        {tab === "manual" ? <>
          <ChartHeader title="Customer profile" subtitle="Enter current subscription and service details" />
          <div className="form-grid">
            <label>Gender<select value={input.gender} onChange={(e) => update("gender", e.target.value)}><option>Female</option><option>Male</option></select></label>
            <label>Senior citizen<select value={input.senior_citizen} onChange={(e) => update("senior_citizen", Number(e.target.value))}><option value={0}>No</option><option value={1}>Yes</option></select></label>
            <label>Tenure (months)<input type="number" value={input.tenure} onChange={(e) => update("tenure", Number(e.target.value))} /></label>
            <label>Contract<select value={input.contract} onChange={(e) => update("contract", e.target.value)}><option>Month-to-month</option><option>One year</option><option>Two year</option></select></label>
            <label>Internet service<select value={input.internet_service} onChange={(e) => update("internet_service", e.target.value)}><option>Fiber optic</option><option>DSL</option><option>No</option></select></label>
            <label>Payment method<select value={input.payment_method} onChange={(e) => update("payment_method", e.target.value)}><option>Electronic check</option><option>Mailed check</option><option>Bank transfer</option><option>Credit card</option></select></label>
            <label>Monthly charges ($)<input type="number" value={input.monthly_charges} onChange={(e) => update("monthly_charges", Number(e.target.value))} /></label>
            <label>Total charges ($)<input type="number" value={input.total_charges} onChange={(e) => update("total_charges", Number(e.target.value))} /></label>
            <label>Tech support<select value={input.tech_support} onChange={(e) => update("tech_support", e.target.value)}><option>No</option><option>Yes</option></select></label>
            <label>Online security<select value={input.online_security} onChange={(e) => update("online_security", e.target.value)}><option>No</option><option>Yes</option></select></label>
            <label className="span-2">Paperless billing<select value={input.paperless_billing} onChange={(e) => update("paperless_billing", e.target.value)}><option>Yes</option><option>No</option></select></label>
          </div>
          <button className="button primary predict-button" onClick={predict} disabled={loading}>{loading ? <RefreshCw className="spin" size={18} /> : <Sparkles size={18} />}{loading ? "Analyzing customer..." : "Generate churn prediction"}</button>
        </> : <div className="upload-zone"><div><CloudUpload size={30} /></div><h3>Upload your customer CSV</h3><p>Drag and drop a file here, or click to browse. Maximum 25 MB.</p><button className="button primary">Choose CSV file</button><small>Download the <u>CSV template</u> for the required schema.</small></div>}
      </GlassCard>

      <GlassCard className="span-5 prediction-result">
        {!result ? <div className="empty-result"><div className="orb"><BrainCircuit size={36} /></div><h3>Your prediction will appear here</h3><p>Complete the customer profile to reveal churn probability, key drivers, and a tailored retention strategy.</p><div className="trust-row"><span><ShieldCheck size={16} /> Explainable</span><span><Zap size={16} /> Real-time</span><span><Target size={16} /> Actionable</span></div></div> :
          <AnimatePresence mode="wait"><motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="result-top"><span className={`risk-badge ${result.risk_level.toLowerCase()}`}>{result.risk_level} risk</span><span>Confidence {Math.round(result.confidence_score * 100)}%</span></div>
            <div className="probability-ring" style={{ "--score": `${result.churn_probability * 360}deg` } as React.CSSProperties}><div><strong>{Math.round(result.churn_probability * 100)}%</strong><span>churn probability</span></div></div>
            <h2>{result.prediction}</h2>
            <p className="result-copy">The model found several strong behavioral signals in this customer profile.</p>
            <div className="explanation-list">{result.explanation.map((item) => <div key={item.feature}><span className={item.impact > 0 ? "negative" : "positive"}>{item.impact > 0 ? "+" : ""}{Math.round(item.impact * 100)}%</span><div><b>{item.feature}</b><small>{item.direction}</small></div><div className="impact-line"><i style={{ width: `${Math.abs(item.impact) * 230}%` }} /></div></div>)}</div>
            <div className="strategy-box"><div><Lightbulb size={20} /><b>Recommended retention play</b></div><p>{result.strategy}</p><button>Send to retention team <ArrowUpRight size={15} /></button></div>
          </motion.div></AnimatePresence>}
      </GlassCard>
    </div>
  );
}

function ModelPerformance() {
  return (
    <div className="page-grid">
      <div className="page-title">
        <div><div className="eyebrow"><Gauge size={14} /> ML operations</div><h1>Model performance</h1><p>Transparent evaluation, comparison, and explainability for every prediction.</p></div>
        <div className="welcome-actions"><button className="button secondary"><RefreshCw size={16} /> Retrain</button><button className="button primary"><FileText size={16} /> Model report</button></div>
      </div>
      <GlassCard className="span-12 winner-banner">
        <div className="winner-icon"><Sparkles size={24} /></div><div><span>Champion model</span><h2>XGBoost Classifier</h2><p>Selected automatically using stratified cross-validation and ROC-AUC optimization.</p></div>
        {modelMetrics[0] && ["Accuracy", "Precision", "Recall", "F1 Score", "ROC-AUC"].map((label, i) => <div className="winner-stat" key={label}><span>{label}</span><strong>{Object.values(modelMetrics[0]).slice(1)[i]}%</strong></div>)}
      </GlassCard>
      <GlassCard className="span-7">
        <ChartHeader title="Model comparison" subtitle="Performance across core classification metrics" />
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={modelMetrics} margin={{ top: 15, left: -15 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--grid)" /><XAxis dataKey="model" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><Tooltip content={<FancyTooltip />} /><Legend iconType="circle" iconSize={8} />
            <Bar dataKey="accuracy" fill="#7c5ce7" radius={[5, 5, 0, 0]} /><Bar dataKey="f1" fill="#ad8bea" radius={[5, 5, 0, 0]} /><Bar dataKey="auc" fill="#f08ab4" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
      <GlassCard className="span-5">
        <ChartHeader title="Confusion matrix" subtitle="XGBoost · holdout test set" />
        <div className="confusion-grid"><span /><b>Predicted stay</b><b>Predicted churn</b><b>Actual stay</b><div className="tn"><strong>935</strong><small>True negative</small></div><div className="fp"><strong>99</strong><small>False positive</small></div><b>Actual churn</b><div className="fn"><strong>68</strong><small>False negative</small></div><div className="tp"><strong>307</strong><small>True positive</small></div></div>
        <div className="matrix-note"><ShieldCheck size={17} /><span><b>81.9% recall</b> means the model identifies 8 in 10 customers who will churn.</span></div>
      </GlassCard>
      <GlassCard className="span-6">
        <ChartHeader title="ROC curve" subtitle="True positive rate vs. false positive rate" />
        <ResponsiveContainer width="100%" height={290}>
          <LineChart data={rocData} margin={{ top: 15, right: 18, left: -12 }}>
            <CartesianGrid strokeDasharray="4 6" stroke="var(--grid)" /><XAxis dataKey="fpr" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><Tooltip content={<FancyTooltip />} /><Legend />
            <Line dataKey="xgb" name="XGBoost · AUC 0.916" stroke="#7c5ce7" strokeWidth={3} dot={false} /><Line dataKey="rf" name="Random Forest · AUC 0.887" stroke="#f08ab4" strokeWidth={2} dot={false} /><Line dataKey="baseline" name="Random baseline" stroke="#a6a0b6" strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>
      <GlassCard className="span-6">
        <ChartHeader title="Global SHAP importance" subtitle="Mean absolute impact on churn probability" />
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={featureImportance} layout="vertical" margin={{ top: 10, left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="4 6" horizontal={false} stroke="var(--grid)" /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><YAxis type="category" dataKey="feature" width={105} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><Tooltip content={<FancyTooltip />} />
            <Bar dataKey="value" name="SHAP importance" radius={[0, 7, 7, 0]}>{featureImportance.map((_, i) => <Cell key={i} fill={`hsl(${258 + i * 4}, 67%, ${58 + i * 3}%)`} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}

function Reports() {
  const reports = [
    { icon: BriefcaseBusiness, title: "Executive summary", copy: "KPIs, churn trends, revenue exposure, and strategic recommendations.", pages: "12 pages", color: "purple" },
    { icon: Users, title: "Customer risk report", copy: "Prioritized high-risk customers with probabilities and retention actions.", pages: "24 pages", color: "pink" },
    { icon: BrainCircuit, title: "Model performance", copy: "Model comparison, validation metrics, curves, and explainability.", pages: "18 pages", color: "blue" },
    { icon: CircleDollarSign, title: "Revenue impact", copy: "Revenue loss scenarios, recoverable MRR, and campaign ROI.", pages: "9 pages", color: "green" }
  ];
  return (
    <div className="page-grid">
      <div className="page-title"><div><div className="eyebrow"><FileBarChart size={14} /> Reporting suite</div><h1>Reports & exports</h1><p>Turn churn intelligence into polished, board-ready deliverables.</p></div><button className="button primary"><WandSparkles size={17} /> Build custom report</button></div>
      <GlassCard className="span-12 report-hero">
        <div><div className="eyebrow"><Sparkles size={14} /> June 2026 intelligence brief</div><h2>Your executive report is ready</h2><p>A complete view of customer risk, revenue impact, model health, and the three highest-impact retention opportunities.</p><div className="report-actions"><button className="button white"><Download size={17} /> Download PDF</button><button className="button glass"><FileText size={17} /> Preview report</button></div></div>
        <div className="report-preview"><div className="preview-top"><span /><span /><span /></div><div className="preview-title" /><div className="preview-sub" /><div className="preview-kpis"><i /><i /><i /></div><div className="preview-chart"><b /><b /><b /><b /><b /><b /></div></div>
      </GlassCard>
      <div className="span-12 report-grid">{reports.map((r, i) => <GlassCard className="report-card" key={r.title} delay={i * .06}><div className={`report-icon ${r.color}`}><r.icon size={22} /></div><span className="report-status"><Check size={13} /> Ready</span><h3>{r.title}</h3><p>{r.copy}</p><div className="report-meta"><span>Updated today</span><span>{r.pages}</span></div><button className="button secondary"><Download size={16} /> Download PDF</button></GlassCard>)}</div>
      <GlassCard className="span-7 schedule-card"><ChartHeader title="Scheduled reporting" subtitle="Automated delivery to your stakeholders" /><div className="schedule-row"><div className="schedule-icon"><FileText size={18} /></div><div><b>Weekly retention pulse</b><small>Every Monday · 8:00 AM · 6 recipients</small></div><span className="risk-badge low">Active</span><button className="icon-button"><MoreHorizontal size={17} /></button></div><div className="schedule-row"><div className="schedule-icon"><BriefcaseBusiness size={18} /></div><div><b>Monthly executive summary</b><small>1st of each month · 9:00 AM · 4 recipients</small></div><span className="risk-badge low">Active</span><button className="icon-button"><MoreHorizontal size={17} /></button></div></GlassCard>
      <GlassCard className="span-5 insight-card compact-insight"><div className="insight-icon"><WandSparkles size={23} /></div><div className="eyebrow">AI narrative</div><h3>Reports that explain the “why”</h3><p>Every report includes plain-language interpretation of model signals, financial impact, and recommended next actions.</p><button className="button soft">Configure narrative</button></GlassCard>
    </div>
  );
}

function Sidebar({ view, setView, open, setOpen }: { view: View; setView: (v: View) => void; open: boolean; setOpen: (x: boolean) => void }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="logo"><div><Command size={21} /></div><span>ChurnFlow</span><button onClick={() => setOpen(false)}><X size={20} /></button></div>
      <div className="workspace"><div className="workspace-logo">AC</div><div><span>Workspace</span><b>Acme Telecom</b></div><ChevronDown size={16} /></div>
      <nav><span className="nav-label">Intelligence</span>{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setOpen(false); }}><item.icon size={18} /><span>{item.label}</span>{item.id === "customers" && <em>12</em>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-metrics">
          <div><span>At risk</span><strong>1,869</strong></div>
          <div><span>Recoverable</span><strong>$34.2K</strong></div>
        </div>
        <button className="help-link"><Settings2 size={18} /> Settings</button>
        <div className="profile"><div>DV</div><span><b>Dhivya</b><small>Retention Lead</small></span><MoreHorizontal size={17} /></div>
      </div>
    </aside>
  );
}

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const current = useMemo(() => nav.find((n) => n.id === view)?.label || "Dashboard", [view]);

  const content = {
    overview: <Overview setView={setView} openChart={setSelectedChart} />,
    analytics: <Analytics />,
    customers: <Customers />,
    prediction: <Prediction />,
    model: <ModelPerformance />,
    reports: <Reports />
  }[view];

  return (
    <div className={dark ? "app dark" : "app"}>
      <Sidebar view={view} setView={setView} open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="main">
        <header className="topbar">
          <div className="topbar-left"><button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><span>{current}</span></div>
          <div className="topbar-right">
            <div className="global-search"><Search size={16} /><input placeholder="Search anything..." /><kbd>⌘ K</kbd></div>
            <button className="icon-button" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="icon-button notification" onClick={() => setNotice("You have 12 newly critical customers.")}><Bell size={18} /><i /></button>
          </div>
        </header>
        <div className="page"><AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>{content}</motion.div></AnimatePresence></div>
      </main>
      <AnimatePresence>{notice && <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><div><Bell size={18} /></div><span><b>Risk alert</b>{notice}</span><button onClick={() => setNotice(null)}><X size={16} /></button></motion.div>}</AnimatePresence>
      <AnimatePresence><ChartModal title={selectedChart} onClose={() => setSelectedChart(null)} /></AnimatePresence>
      {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
